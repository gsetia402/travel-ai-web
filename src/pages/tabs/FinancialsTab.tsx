import { useEffect, useState, useRef } from 'react';
import { getFinancialSummary, getExpenses, createExpense, updateExpense, deleteExpense, uploadReceipt, getReceiptUrl } from '../../services/tripops';
import { DollarSign, TrendingUp, TrendingDown, Percent, Plus, Pencil, Trash2, X, Upload, Eye, Download, Receipt, BarChart3, FileText } from 'lucide-react';

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

  const emptyForm = { description: '', category: 'TRANSPORT', amount: '', vendor_name: '', expense_date: '', notes: '' };
  const [form, setForm] = useState<any>(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([getFinancialSummary(tripId), getExpenses(tripId)]);
      setSummary(s.data);
      setExpenses(e.data);
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

  return (
    <div className="space-y-6">
      {/* Financial Model Badge */}
      {summary && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            summary.financial_model === 'PACKAGE' ? 'bg-purple-50 text-purple-700' :
            summary.financial_model === 'VARIABLE_BUDGET' ? 'bg-amber-50 text-amber-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {summary.financial_model === 'PACKAGE' ? 'Package' :
             summary.financial_model === 'VARIABLE_BUDGET' ? 'Variable Budget' : 'Sponsored'}
          </span>
          <span className="text-xs text-gray-400">
            {summary.financial_model === 'PACKAGE' ? 'Revenue, collections & profitability tracking coming soon' :
             summary.financial_model === 'VARIABLE_BUDGET' ? 'Contribution & variable cost tracking coming soon' :
             'Organization pays all expenses'}
          </span>
        </div>
      )}

      {/* Dashboard Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card icon={DollarSign} label="Total Budget" value={fmt(summary.total_budget)} color="text-blue-600 bg-blue-50" />
          <Card icon={TrendingUp} label="Total Expenses" value={fmt(summary.amount_spent)} color="text-red-600 bg-red-50" />
          <Card icon={TrendingDown} label="Remaining" value={fmt(summary.remaining_budget)} color="text-green-600 bg-green-50" />
          <Card icon={Percent} label="Utilization" value={`${budgetPct}%`} color={`${budgetColor} ${budgetPct > 100 ? 'bg-red-50' : budgetPct >= 80 ? 'bg-amber-50' : 'bg-green-50'}`} />
        </div>
      )}

      {/* Future reserved cards for PACKAGE and VARIABLE_BUDGET models */}
      {summary && summary.financial_model === 'PACKAGE' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Expected Revenue</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Collections</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Outstanding</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Profitability</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
        </div>
      )}
      {summary && summary.financial_model === 'VARIABLE_BUDGET' && (
        <div className="grid grid-cols-3 gap-4 opacity-50">
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Contributions</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Additional Required</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-400">Actual vs Estimated</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Coming Soon</p>
          </div>
        </div>
      )}

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

      {/* Add/Edit Modal */}
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
