import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, CheckCircle, Clock, AlertCircle, Eye, FileText } from 'lucide-react';

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
        fetch(`${base}/traveller/payment-summary`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${base}/traveller/payments`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${base}/traveller/payment-config`, { headers }).then(r => r.ok ? r.json() : null),
      ]);

      setSummary(sumRes);
      setPayments(Array.isArray(payRes) ? payRes : []);
      setConfig(cfgRes);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  function openPaymentModal() {
    const outstanding = summary?.outstanding_amount || 0;
    setAmount(outstanding > 0 ? String(outstanding) : '');
    setPayType('TRAVELLER_PAYMENT');
    setNotes('');
    setProofFile(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const base = localStorage.getItem('tripops_api_base') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('traveller_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${base}/traveller/payments`, {
        method: 'POST', headers,
        body: JSON.stringify({ amount: Number(amount), payment_type: payType, notes: notes || undefined }),
      });
      const newPay = await res.json();

      if (proofFile && newPay.payment_id) {
        const form = new FormData();
        form.append('file', proofFile);
        await fetch(`${base}/traveller/payments/${newPay.payment_id}/proof`, {
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

  function fmtDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (!user) return <p className="text-gray-500">Loading...</p>;
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading payment details...</p>
      </div>
    </div>
  );

  const regFeeEnabled = config?.registration_fee_enabled;
  const regFeeAmount = config?.registration_fee_amount || 0;
  const outstanding = summary?.outstanding_amount || 0;
  const expectedAmount = summary?.expected_amount || 0;
  const isPaid = summary?.payment_status === 'PAID';

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Payments</h2>

      {/* Empty state when no payment info available */}
      {(!summary || summary.expected_amount === 0) && payments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign size={24} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No Payment Required Yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Your trip organizer hasn't set up payment requirements yet. You'll see your amount due here once it's configured.
          </p>
        </div>
      )}

      {/* Top Summary — clear at-a-glance view */}
      {summary && summary.expected_amount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-gray-100">
            {/* Total Amount Due */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <DollarSign size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Amount Due</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{fmt(summary.expected_amount)}</span>
            </div>
            {/* Amount Paid */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Amount Paid</span>
              </div>
              <span className="text-lg font-bold text-green-700">{fmt(summary.amount_paid)}</span>
            </div>
            {/* Outstanding Amount */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${outstanding > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  {outstanding > 0 ? <AlertCircle size={16} className="text-amber-600" /> : <CheckCircle size={16} className="text-green-600" />}
                </div>
                <span className="text-sm font-medium text-gray-700">Outstanding Amount</span>
              </div>
              <span className={`text-lg font-bold ${outstanding > 0 ? 'text-amber-700' : 'text-green-700'}`}>{fmt(outstanding)}</span>
            </div>
            {/* Payment Status */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Payment Status</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                summary.payment_status === 'PAID' ? 'bg-green-100 text-green-700' :
                summary.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {summary.payment_status === 'PAID' && <CheckCircle size={14} />}
                {summary.payment_status === 'PARTIAL' && <Clock size={14} />}
                {summary.payment_status === 'PENDING' && <AlertCircle size={14} />}
                {summary.payment_status === 'PAID' ? 'Paid' : summary.payment_status === 'PARTIAL' ? 'Partial' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Registration Fee Notice */}
      {regFeeEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">Registration Fee: {fmt(regFeeAmount)}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {summary?.registration_fee_paid ? '✓ Registration fee paid' : 'Included in your total amount due'}
          </p>
        </div>
      )}

      {/* Submit Payment Button — hidden if fully paid */}
      {!isPaid && outstanding > 0 && (
        <button onClick={openPaymentModal} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm flex items-center justify-center gap-2 shadow-sm">
          <DollarSign size={16} /> Submit Payment — {fmt(outstanding)}
        </button>
      )}

      {isPaid && (
        <div className="w-full py-3 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
          <CheckCircle size={16} /> All payments complete
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h3 className="px-4 py-3 font-semibold text-gray-900 border-b text-sm">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={p.payment_id} className={p.status === 'REJECTED' ? 'opacity-60' : ''}>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(p.payment_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.proof_path && <FileText size={10} />}
                        {p.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {payments.some((p: any) => p.status === 'REJECTED' && p.rejected_reason) && (
          <div className="border-t border-gray-100 px-4 py-2">
            {payments.filter((p: any) => p.status === 'REJECTED' && p.rejected_reason).map((p: any) => (
              <p key={p.payment_id} className="text-xs text-red-500">
                {fmtDate(p.payment_date)} — Rejected: {p.rejected_reason}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Submit Payment Modal — amount prefilled & read-only by default */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Submit Payment</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* Amount — prefilled with outstanding, read-only */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Amount</label>
              <p className="text-2xl font-bold text-gray-900">₹{Number(amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400 mt-1">Auto-calculated from outstanding amount</p>
              <input type="hidden" name="amount" value={amount} />
            </div>

            {regFeeEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select value={payType} onChange={e => setPayType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="TRAVELLER_PAYMENT">Trip Payment</option>
                  <option value="REGISTRATION_FEE">Registration Fee</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bank transfer ref #1234" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof <span className="text-gray-400">(screenshot / receipt)</span></label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
              {proofFile && <p className="text-xs text-gray-500 mt-1">✓ {proofFile.name}</p>}
            </div>

            <button type="submit" disabled={saving || !amount || Number(amount) <= 0} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm">
              {saving ? 'Submitting...' : `Submit ₹${Number(amount).toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
