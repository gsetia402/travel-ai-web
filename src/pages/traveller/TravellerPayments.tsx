import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, Upload, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

interface TravellerUser { traveller_id: string; trip_id: string; first_name: string; last_name: string; }

export default function TravellerPayments() {
  const { user } = useOutletContext<{ user: TravellerUser | null }>();
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [payType, setPayType] = useState('TRAVELLER_PAYMENT');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const base = localStorage.getItem('tripops_api_base') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('traveller_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [sumRes, payRes, cfgRes] = await Promise.all([
        fetch(`${base}/trips/${user.trip_id}/traveller-payment-summaries`, { headers }).then(r => r.json()),
        fetch(`${base}/trips/${user.trip_id}/travellers/${user.traveller_id}/payments`, { headers }).then(r => r.json()),
        fetch(`${base}/trips/${user.trip_id}/payment-config`, { headers }).then(r => r.json()),
      ]);

      const mySummary = Array.isArray(sumRes) ? sumRes.find((s: any) => s.traveller_id === user.traveller_id) : null;
      setSummary(mySummary);
      setPayments(Array.isArray(payRes) ? payRes : []);
      setConfig(cfgRes);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const base = localStorage.getItem('tripops_api_base') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('traveller_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${base}/trips/${user.trip_id}/payments`, {
        method: 'POST', headers,
        body: JSON.stringify({ amount: Number(amount), payment_type: payType, traveller_id: user.traveller_id, notes: notes || undefined }),
      });
      const newPay = await res.json();

      if (proofFile && newPay.payment_id) {
        const form = new FormData();
        form.append('file', proofFile);
        await fetch(`${base}/payments/${newPay.payment_id}/proof`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: form,
        });
      }
      setShowModal(false);
      setAmount(''); setNotes(''); setProofFile(null);
      await load();
    } catch {}
    setSaving(false);
  }

  function fmt(n: number) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  if (!user) return <p className="text-gray-500">Loading...</p>;
  if (loading) return <p className="text-gray-500">Loading payments...</p>;

  const regFeeEnabled = config?.registration_fee_enabled;
  const regFeeAmount = config?.registration_fee_amount || 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Payments</h2>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Expected</p>
            <p className="text-lg font-bold text-gray-900">{fmt(summary.expected_amount)}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-lg font-bold text-green-700">{fmt(summary.amount_paid)}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-lg font-bold text-amber-700">{fmt(summary.outstanding_amount)}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <p className="text-xs text-gray-500">Status</p>
            <p className={`text-lg font-bold ${summary.payment_status === 'PAID' ? 'text-green-700' : summary.payment_status === 'PARTIAL' ? 'text-amber-700' : 'text-red-700'}`}>
              {summary.payment_status}
            </p>
          </div>
        </div>
      )}

      {/* Registration Fee Notice */}
      {regFeeEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">Registration Fee: {fmt(regFeeAmount)}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {summary?.registration_fee_paid ? '✓ Registration fee paid' : 'Registration fee is included in your expected amount'}
          </p>
        </div>
      )}

      {/* Submit Payment Button */}
      <button onClick={() => setShowModal(true)} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
        <DollarSign size={16} /> Submit Payment
      </button>

      {/* Payment History */}
      <div className="bg-white rounded-lg border">
        <h3 className="px-4 py-3 font-semibold text-gray-900 border-b text-sm">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No payments yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((p: any) => (
              <div key={p.payment_id} className={`p-4 ${p.status === 'REJECTED' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{fmt(p.amount)}</p>
                    <p className="text-xs text-gray-500">{p.payment_date || 'No date'}{p.notes ? ` · ${p.notes}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.proof_path && <Eye size={14} className="text-blue-500" />}
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                  </div>
                </div>
                {p.status === 'REJECTED' && p.rejected_reason && (
                  <p className="text-xs text-red-500 mt-1">Rejected: {p.rejected_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Submit Payment</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select value={payType} onChange={e => setPayType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="TRAVELLER_PAYMENT">Trip Payment</option>
                {regFeeEnabled && <option value="REGISTRATION_FEE">Registration Fee</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input required type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proof (optional)</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              {saving ? 'Submitting...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
