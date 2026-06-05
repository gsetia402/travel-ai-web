import { useEffect, useState, useRef } from 'react';
import { getTripDocuments, uploadTripDocument as uploadTripDoc, deleteTripDocument, getTripDocumentDownloadUrl } from '../../services/tripops';
import { Upload, Trash2, Download, FileText, Image, X, Plus } from 'lucide-react';

const TRIP_DOC_TYPES = [
  'HOTEL_VOUCHER', 'FLIGHT_ITINERARY', 'BOARDING_PASS', 'BUS_TICKET', 'TRAIN_TICKET',
  'EVENT_TICKET', 'TRIP_GUIDE', 'PACKING_GUIDE', 'EMERGENCY_CONTACTS', 'TRAVEL_INSURANCE', 'OTHER',
];

export default function DocumentCenterTab({ tripId }: { tripId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('HOTEL_VOUCHER');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try { const { data } = await getTripDocuments(tripId); setDocs(data); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleUpload() {
    if (!file || !title.trim()) return;
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('document_type', docType);
    fd.append('file', file);
    if (description.trim()) fd.append('description', description.trim());
    try {
      await uploadTripDoc(tripId, fd, setProgress);
      setShowUpload(false); setTitle(''); setDescription(''); setFile(null); setProgress(0);
      await load();
    } catch (err: any) { alert(err?.response?.data?.detail || 'Upload failed'); }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return;
    try { await deleteTripDocument(docId); await load(); } catch {}
  }

  function getFileIcon(name: string) {
    const ext = name?.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText size={14} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <Image size={14} className="text-blue-500" />;
    return <FileText size={14} className="text-gray-400" />;
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-500">Loading documents...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Trip Documents</h3>
          <p className="text-xs text-gray-400 mt-0.5">Share booking vouchers, tickets, and guides with travellers</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Upload Document
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 relative">
            <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-lg font-bold text-gray-900">Upload Trip Document</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hotel Voucher - Jaisalmer" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
                {TRIP_DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer" />
            </div>
            {uploading && (
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button onClick={handleUpload} disabled={uploading || !file || !title.trim()} className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              <Upload size={16} /> {uploading ? `Uploading ${progress}%...` : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No trip documents uploaded yet.</p>
          <p className="text-xs text-gray-300 mt-1">Upload vouchers, tickets, and guides for your travellers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Document</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Uploaded</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d: any) => (
                <tr key={d.document_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(d.file_name)}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{d.title}</p>
                        <p className="text-xs text-gray-400 truncate">{d.file_name}{d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium whitespace-nowrap">{d.document_type?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={getTripDocumentDownloadUrl(d.document_id)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600" title="Download"><Download size={14} /></a>
                      <button onClick={() => handleDelete(d.document_id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
