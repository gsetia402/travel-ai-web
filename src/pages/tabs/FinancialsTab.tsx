import { useEffect, useState, useRef } from 'react';
import { getFinancialSummary, getExpenses, createExpense, updateExpense, deleteExpense, uploadReceipt, getReceiptUrl, getPaymentDashboard, getPaymentConfig, updatePaymentConfig, getPayments, recordPayment, rejectPayment, uploadPaymentProof, getPaymentProofUrl, getTravellerPaymentSummaries } from '../../services/tripops';
import { DollarSign, TrendingUp, TrendingDown, Percent, Plus, Pencil, Trash2, X, Upload, Eye, Download, Receipt, BarChart3, FileText, Users, CheckCircle, Clock, AlertCircle, Settings, Ban } from 'lucide-react';

const CATEGORIES = ['TRANSPORT', 'ACCOMMODATION', 'FOOD', 'ACTIVITIES', 'PERMITS', 'EMERGENCY', 'HOTEL', 'FLIGHTS', 'INSURANCE', 'VISA', 'EVENTS', 'MISCELLANEOUS'];
const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORT: 'bg-blue-500', ACCOMMODATION: 'bg-purple-500', FOOD: 'bg-orange-500', ACTIVITIES: 'bg-green-500',
  PERMITS: 'bg-yellow-500', EMERGENCY: 'bg-red-500', HOTEL: 'bg-indigo-500', FLIGHTS: 'bg-sky-500',
  INSURANCE: 'bg-teal-500', VISA: 'bg-pink-500', EVENTS: 'bg-cyan-500', MISCELLANEOUS: 'bg-gray-500',
};

interface Expense {
  expense_id: string; trip_id: string; category: string; description: string; amount: number;
  vendor_name?: string; expense_date?: string; notes?: string; receipt_path?: string; created_at?: string;
}

export default function FinancialsTab({ tripId }: { tripId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [receiptModal, setReceiptModal] = useState<Expense | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'overview' | 'expenses' | 'payments'>('overview');
  const [payDash, setPayDash] = useState<any>(null);
  const [payConfig, setPayConfig] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [travellerSummaries, setTravellerSummaries] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [payForm, setPayForm] = useState<any>({ amount: '', payment_date: '', notes: '', traveller_id: '', payment_type: 'SPONSOR_PAYMENT', sponsor_name: '' });
  const [configForm, setConfigForm] = useState<any>({});
  const [proofFile, setProofFile] = useState<File | null>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const emptyForm = { description: '', category: 'TRANSPORT', amount: '', vendor_name: '', expense_date: '', notes: '' };
  const [form, setForm] = useState<any>(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const [s, e, pd, pc, pay, ts] = await Promise.all([
        getFinancialSummary(tripId), getExpenses(tripId),
        getPaymentDashboard(tripId).catch(() => ({ data: null })),
        getPaymentConfig(tripId).catch(() => ({ data: null })),
        getPayments(tripId).catch(() => ({ data: [] })),
        getTravellerPaymentSummaries(tripId).catch(() => ({ data: [] })),
      ]);
      setSummary(s.data);
      setExpenses(e.data);
      setPayDash(pd.data);
      setPayConfig(pc.data);
      setPayments(pay.data || []);
      setTravellerSummaries(ts.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  function openAdd() { setEditId(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(exp: Expense) {
    setEditId(exp.expense_id);
    setForm({ description: exp.description, category: exp.category, amount: String(exp.amount), vendor_name: exp.vendor_name || '', expense_date: exp.expense_date || '', notes: exp.notes || '' });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (!payload.expense_date) delete payload.expense_date;
      if (!payload.vendor_name) delete payload.vendor_name;
      if (!payload.notes) delete payload.notes;
      if (editId) { await updateExpense(editId, payload); }
      else { await createExpense(tripId, payload); }
      setShowModal(false);
      await load();
    } catch (err: any) { alert(err?.response?.data?.detail || 'Failed to save expense'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try { await deleteExpense(id); setDeleteConfirm(null); await load(); } catch {}
  }

  async function handleReceiptUpload() {
    if (!receiptModal || !receiptFile) return;
    setUploading(true);
    try { await uploadReceipt(receiptModal.expense_id, receiptFile); setReceiptModal(null); setReceiptFile(null); await load(); }
    catch (err: any) { alert(err?.response?.data?.detail || 'Upload failed'); }
    setUploading(false);
  }

  function exportCSV() {
    const header = 'Date,Description,Category,Amount,Vendor,Notes\n';
    const rows = expenses.map(e => `${e.expense_date || ''},${e.description},${e.category},${e.amount},${e.vendor_name || ''},${(e.notes || '').replace(/,/g, ';')}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `expenses_${tripId}.csv`; a.click();
  }

  if (loading) return <div className="text-gray-500">Loading financials...</div>;

  const breakdown = summary?.category_breakdown || {};
  const breakdownEntries = Object.entries(breakdown).sort(([,a]: any, [,b]: any) => b - a);
  const budgetPct = summary?.utilization_pct || 0;
  const budgetColor = budgetPct > 100 ? 'text-red-600' : budgetPct >= 80 ? 'text-amber-600' : 'text-green-600';

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        amount: Number(payForm.amount),
        payment_type: 'SPONSOR_PAYMENT',
        payment_date: payForm.payment_date || undefined,
        notes: payForm.notes || undefined,
        sponsor_name: payForm.sponsor_name || undefined,
      };
      const { data: newPayment } = await recordPayment(tripId, payload);
      if (proofFile) {
        await uploadPaymentProof(newPayment.payment_id, proofFile);
      }
      setShowPaymentModal(false);
      setPayForm({ amount: '', payment_date: '', notes: '', traveller_id: '', payment_type: 'SPONSOR_PAYMENT', sponsor_name: '' });
      setProofFile(null);
      await load();
    } catch {}
    setSaving(false);
  }

  async function handleReject(paymentId: string) {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await rejectPayment(paymentId, reason || undefined);
      await load();
    } catch {}
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePaymentConfig(tripId, configForm);
      setShowConfigModal(false);
      await load();
    } catch {}
    setSaving(false);
  }

  function openConfigModal() {
    setConfigForm({
      expected_amount_per_traveller: payConfig?.expected_amount_per_traveller || 0,
      registration_fee_enabled: payConfig?.registration_fee_enabled || false,
      registration_fee_amount: payConfig?.registration_fee_amount || 0,
      sponsor_name: payConfig?.sponsor_name || '',
      sponsor_commitment: payConfig?.sponsor_commitment || 0,
    });
    setShowConfigModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Financial Model Badge + Config */}
      {summary && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              summary.financial_model === 'TRAVELLER_FUNDED' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {summary.financial_model === 'TRAVELLER_FUNDED' ? 'Traveller Funded' : 'Sponsored'}
            </span>
          </div>
          <button onClick={openConfigModal} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Settings size={13} /> Payment Config
          </button>
        </div>
      )}

      {/* Dashboard Cards — unified terminology */}
      {payDash && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card icon={DollarSign} label="Total Budget" value={fmt(payDash.total_budget)} color="text-blue-600 bg-blue-50" />
          <Card icon={TrendingUp} label="Amount Received" value={fmt(payDash.amount_received)} color="text-emerald-600 bg-emerald-50" />
          <Card icon={AlertCircle} label="Outstanding" value={fmt(payDash.outstanding_amount)} color="text-amber-600 bg-amber-50" />
          <Card icon={Receipt} label="Expenses" value={fmt(payDash.expenses)} color="text-red-600 bg-red-50" />
          <Card icon={TrendingDown} label="Available Balance" value={fmt(payDash.available_balance)} color="text-green-600 bg-green-50" />
        </div>
      )}

      {/* Payment Status Summary — Traveller Funded */}
      {payDash && payDash.financial_model === 'TRAVELLER_FUNDED' && payDash.total_travellers > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Payment Status Summary</h4>
            <span className="text-xs text-gray-500">{fmt(payDash.expected_per_traveller)} per traveller × {payDash.total_travellers} travellers</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm"><span className="font-semibold text-green-700">{payDash.paid_count}</span> Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm"><span className="font-semibold text-amber-700">{payDash.partial_count}</span> Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm"><span className="font-semibold text-red-700">{payDash.pending_count}</span> Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Info */}
      {payDash && payDash.financial_model === 'SPONSORED' && payDash.sponsor_name && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Sponsor Details</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Sponsor:</span> <span className="font-medium">{payDash.sponsor_name}</span></div>
            <div><span className="text-gray-500">Commitment:</span> <span className="font-medium">{fmt(payDash.sponsor_commitment)}</span></div>
            <div><span className="text-gray-500">Received:</span> <span className="font-medium text-green-700">{fmt(payDash.sponsor_received)}</span></div>
            <div><span className="text-gray-500">Outstanding:</span> <span className="font-medium text-amber-700">{fmt(payDash.sponsor_outstanding)}</span></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['overview', 'expenses', 'payments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'overview' ? 'Overview' : t === 'expenses' ? 'Expenses' : 'Payments'}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {tab === 'overview' && <>
      {/* Budget Progress */}
      {summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Budget Utilization</span>
            <span className={`font-semibold ${budgetColor}`}>{budgetPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${budgetPct > 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Financial Summary Stats */}
      {summary && summary.expense_count > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="Transactions" value={String(summary.expense_count)} />
          <MiniStat label="Average Expense" value={fmt(summary.average_expense)} />
          <MiniStat label="Largest Expense" value={fmt(summary.largest_expense)} />
          <MiniStat label="Categories Used" value={String(breakdownEntries.length)} />
        </div>
      )}

      {/* Category Breakdown */}
      {breakdownEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={16} /> Category Breakdown</h3>
          <div className="space-y-3">
            {breakdownEntries.map(([cat, amt]: any) => {
              const pct = summary.amount_spent > 0 ? Math.round((amt / summary.amount_spent) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-400'}`} />
                      {cat.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-gray-900">{fmt(amt)} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </>}

      {/* === EXPENSES TAB === */}
      {tab === 'expenses' && <>
      {/* Expense List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Expenses</h3>
          <div className="flex gap-2">
            {expenses.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Download size={14} /> Export CSV
              </button>
            )}
            <button onClick={openAdd} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Add Expense
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No expenses recorded yet. Click "Add Expense" to get started.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Category</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Vendor</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600">Receipt</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map(exp => (
                    <tr key={exp.expense_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600">{exp.expense_date || '—'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{exp.description}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[exp.category] || 'bg-gray-400'}`} />
                          {exp.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmt(exp.amount)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{exp.vendor_name || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        {exp.receipt_path ? (
                          <a href={getReceiptUrl(exp.expense_id)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><Eye size={15} /></a>
                        ) : (
                          <button onClick={() => { setReceiptModal(exp); setReceiptFile(null); }} className="text-gray-400 hover:text-gray-600"><Upload size={15} /></button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(exp)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteConfirm(exp.expense_id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {expenses.map(exp => (
                <div key={exp.expense_id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-500">{exp.expense_date || 'No date'} · {exp.vendor_name || 'N/A'}</p>
                    </div>
                    <p className="font-bold text-gray-900">{fmt(exp.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[exp.category] || 'bg-gray-400'}`} />
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                    <div className="flex gap-2">
                      {exp.receipt_path ? (
                        <a href={getReceiptUrl(exp.expense_id)} target="_blank" rel="noreferrer" className="text-blue-600"><Eye size={14} /></a>
                      ) : (
                        <button onClick={() => { setReceiptModal(exp); setReceiptFile(null); }} className="text-gray-400"><Upload size={14} /></button>
                      )}
                      <button onClick={() => openEdit(exp)} className="text-gray-400"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm(exp.expense_id)} className="text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      </>}

      {/* === PAYMENTS TAB === */}
      {tab === 'payments' && <>

      {/* --- Traveller Funded: show per-traveller table + their payment records --- */}
      {payDash?.financial_model === 'TRAVELLER_FUNDED' && (
        <>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={16} /> Traveller Payments</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Expected per traveller: <span className="font-semibold">{fmt(payDash.expected_per_traveller)}</span>
              {' '}(Budget {fmt(payDash.total_budget)} ÷ {payDash.total_travellers} travellers)
            </p>
          </div>
          {travellerSummaries.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No travellers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Traveller</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Expected</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Paid</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Outstanding</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Last Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {travellerSummaries.map((ts: any) => (
                    <tr key={ts.traveller_id}>
                      <td className="px-3 py-2 font-medium text-gray-900">{ts.traveller_name}</td>
                      <td className="px-3 py-2 text-right">{fmt(ts.expected_amount)}</td>
                      <td className="px-3 py-2 text-right text-green-700 font-medium">{fmt(ts.amount_paid)}</td>
                      <td className="px-3 py-2 text-right text-amber-700 font-medium">{fmt(ts.outstanding_amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          ts.payment_status === 'PAID' ? 'bg-green-100 text-green-700' :
                          ts.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{ts.payment_status}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{ts.last_payment_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Traveller-submitted payment records — organizer can verify/reject */}
        {payments.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payment Records</h3>
              <p className="text-xs text-gray-500 mt-0.5">Traveller-submitted payments. Verify or reject below.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Traveller</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Proof</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p: any) => (
                    <tr key={p.payment_id} className={p.status === 'REJECTED' ? 'opacity-50' : ''}>
                      <td className="px-3 py-2 text-gray-600">{p.payment_date || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{travellerSummaries.find((t: any) => t.traveller_id === p.traveller_id)?.traveller_name || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(p.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        {p.proof_path ? <a href={getPaymentProofUrl(p.payment_id)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><Eye size={14} /></a> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status === 'APPROVED' ? 'Approved' : 'Rejected'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.status === 'APPROVED' && (
                          <button onClick={() => handleReject(p.payment_id)} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-0.5 ml-auto"><Ban size={12} /> Reject</button>
                        )}
                        {p.status === 'REJECTED' && p.rejected_reason && (
                          <span className="text-xs text-gray-400" title={p.rejected_reason}>Reason: {p.rejected_reason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
      )}

      {/* --- Sponsored: sponsor payment records --- */}
      {payDash?.financial_model === 'SPONSORED' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Sponsor Payment Records</h3>
            <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Record Sponsor Payment
            </button>
          </div>
          {payments.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No sponsor payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Sponsor</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Proof</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p: any) => (
                    <tr key={p.payment_id} className={p.status === 'REJECTED' ? 'opacity-50' : ''}>
                      <td className="px-3 py-2 text-gray-600">{p.payment_date || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{p.sponsor_name || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(p.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        {p.proof_path ? <a href={getPaymentProofUrl(p.payment_id)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><Eye size={14} /></a> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status === 'APPROVED' ? 'Approved' : 'Rejected'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.status === 'APPROVED' && (
                          <button onClick={() => handleReject(p.payment_id)} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-0.5 ml-auto"><Ban size={12} /> Reject</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      </>}

      {/* === MODALS === */}

      {/* Record Sponsor Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRecordPayment} className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Record Sponsor Payment</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                <input value={payForm.sponsor_name} onChange={e => setPayForm({ ...payForm, sponsor_name: e.target.value })} placeholder="e.g. XYZ Corp" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input required type="number" min="1" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional notes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof (optional)</label>
                <input ref={proofRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                {proofFile && <p className="text-xs text-gray-500 mt-1">{proofFile.name}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Record Payment'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payment Configuration</h3>
              <button type="button" onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {summary?.financial_model === 'TRAVELLER_FUNDED' && payDash && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800 font-medium">Auto-calculated per traveller</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    {fmt(payDash.total_budget)} budget ÷ {payDash.total_travellers} travellers = <span className="font-bold">{fmt(payDash.expected_per_traveller)}</span> per person
                  </p>
                  <p className="text-xs text-purple-500 mt-1">This value updates automatically when travellers are added or removed.</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={configForm.registration_fee_enabled || false} onChange={e => setConfigForm({ ...configForm, registration_fee_enabled: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                <label className="text-sm font-medium text-gray-700">Registration Fee Required</label>
              </div>
              {configForm.registration_fee_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee Amount (₹)</label>
                  <input type="number" min="0" step="1" value={configForm.registration_fee_amount || ''} onChange={e => setConfigForm({ ...configForm, registration_fee_amount: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              {summary?.financial_model === 'SPONSORED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                    <input value={configForm.sponsor_name || ''} onChange={e => setConfigForm({ ...configForm, sponsor_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Commitment (₹)</label>
                    <input type="number" min="0" step="1" value={configForm.sponsor_commitment || ''} onChange={e => setConfigForm({ ...configForm, sponsor_commitment: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Config'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{editId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name *</label>
                <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Merchant</label>
                  <input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} placeholder="e.g. Hotel Taj, VRL Travels" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Add Expense'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Upload Receipt</h3>
              <button onClick={() => setReceiptModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">For: <span className="font-medium">{receiptModal.description}</span></p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              {receiptFile && <p className="text-xs text-gray-500">{receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button onClick={() => setReceiptModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleReceiptUpload} disabled={!receiptFile || uploading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6 text-center">
            <Trash2 size={32} className="mx-auto text-red-500 mb-3" />
            <p className="font-semibold text-gray-900 mb-1">Delete Expense?</p>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function Card({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
