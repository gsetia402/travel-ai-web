import { useEffect, useState, useRef } from 'react';
import { getDocumentSummary, getDocumentRequirements, addDocumentRequirement, deleteDocumentRequirement, getTravellers, getTravellerDocuments, uploadTravellerDocument, verifyDocument, rejectDocument, deleteDocument, getDocumentDownloadUrl } from '../../services/tripops';
import { FileCheck, FileX, FileClock, Plus, Trash2, X, Shield, ShieldOff, Upload, Eye, Download, XCircle, ChevronDown, ChevronUp, FileText, Image } from 'lucide-react';

const DOC_TYPES = ['PASSPORT', 'VISA', 'GOVERNMENT_ID', 'STUDENT_ID', 'INSURANCE', 'CONSENT_FORM', 'MEDICAL_CERTIFICATE', 'TRAVEL_PERMIT', 'OTHER'];
const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png';

export default function DocumentsTab({ tripId }: { tripId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReq, setShowAddReq] = useState(false);
  const [newDocType, setNewDocType] = useState('PASSPORT');
  const [newMandatory, setNewMandatory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedTraveller, setExpandedTraveller] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<{ travellerId: string; name: string } | null>(null);
  const [uploadDocType, setUploadDocType] = useState('PASSPORT');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [s, r, t] = await Promise.all([getDocumentSummary(tripId), getDocumentRequirements(tripId), getTravellers(tripId)]);
      setSummary(s.data);
      setRequirements(r.data);
      const enriched = await Promise.all(
        t.data.map(async (tr: any) => {
          let docs: any[] = [];
          try { const { data } = await getTravellerDocuments(tr.traveller_id); docs = data; } catch {}
          return { ...tr, docs };
        })
      );
      setTravellers(enriched);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleAddRequirement() {
    setSaving(true);
    try { await addDocumentRequirement(tripId, { document_type: newDocType, mandatory: newMandatory }); setShowAddReq(false); await load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Failed'); }
    setSaving(false);
  }

  async function handleDeleteRequirement(id: string) { try { await deleteDocumentRequirement(id); await load(); } catch {} }

  async function handleUpload() {
    if (!uploadModal || !uploadFile) return;
    setUploading(true); setUploadProgress(0);
    try {
      await uploadTravellerDocument(uploadModal.travellerId, uploadDocType, uploadFile, (pct) => setUploadProgress(pct));
      setUploadModal(null); setUploadFile(null); setUploadProgress(0); await load();
    } catch (err: any) { alert(err?.response?.data?.detail || 'Upload failed'); }
    setUploading(false);
  }

  async function handleVerify(docId: string) { try { await verifyDocument(docId); await load(); } catch {} }
  async function handleReject(docId: string) { try { await rejectDocument(docId); await load(); } catch {} }
  async function handleDeleteDoc(docId: string) { if (!confirm('Delete this document?')) return; try { await deleteDocument(docId); await load(); } catch {} }

  function getFileIcon(fileName: string) {
    const ext = fileName?.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText size={14} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <Image size={14} className="text-blue-500" />;
    return <FileText size={14} className="text-gray-400" />;
  }

  function isPreviewable(fileName: string) {
    const ext = fileName?.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'pdf'].includes(ext || '');
  }

  const mandatoryReqs = requirements.filter((r: any) => r.mandatory);

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-500">Loading documents...</div>;

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard icon={FileClock} label="Required" value={summary.required_documents} color="text-gray-600" />
          <StatCard icon={FileCheck} label="Uploaded" value={summary.uploaded_documents} color="text-blue-600" />
          <StatCard icon={FileCheck} label="OK" value={summary.verified_documents} color="text-green-600" />
          <StatCard icon={FileX} label="Rejected" value={summary.rejected_documents ?? 0} color="text-red-600" />
          <StatCard icon={FileX} label="Missing" value={summary.missing_documents} color="text-orange-600" />
        </div>
      )}

      {/* Document Requirements */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Requirements</h3>
          <button onClick={() => setShowAddReq(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"><Plus size={13} /> Add</button>
        </div>
        {showAddReq && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <div className="flex justify-between items-center mb-3"><h4 className="font-medium text-gray-900 text-sm">Add Requirement</h4><button onClick={() => setShowAddReq(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button></div>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><label className="block text-xs font-medium text-gray-600 mb-1">Type</label><select value={newDocType} onChange={(e) => setNewDocType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{DOC_TYPES.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Level</label><select value={newMandatory ? 'yes' : 'no'} onChange={(e) => setNewMandatory(e.target.value === 'yes')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="yes">Mandatory</option><option value="no">Optional</option></select></div>
              <button onClick={handleAddRequirement} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '...' : 'Add'}</button>
            </div>
          </div>
        )}
        {requirements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requirements.map((req: any) => (
              <div key={req.requirement_id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs group">
                {req.mandatory ? <Shield size={12} className="text-red-500" /> : <ShieldOff size={12} className="text-gray-400" />}
                <span className="font-medium text-gray-700">{(req.document_type || '').replace(/_/g, ' ')}</span>
                <button onClick={() => handleDeleteRequirement(req.requirement_id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"><X size={11} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Traveller Documents Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Traveller Documents</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Traveller</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Required</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Verification</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {travellers.map((t) => {
                const ok = t.docs.filter((d: any) => d.verification_status !== 'REJECTED').length;
                const rejected = t.docs.filter((d: any) => d.verification_status === 'REJECTED').length;
                const isExpanded = expandedTraveller === t.traveller_id;
                return (
                  <tr key={t.traveller_id} className="group">
                    <td colSpan={5} className="p-0">
                      <div className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedTraveller(isExpanded ? null : t.traveller_id)}>
                        <div className="flex-1 font-medium text-gray-900 flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          {t.first_name} {t.last_name}
                        </div>
                        <div className="w-24 text-center text-gray-600">{mandatoryReqs.length}</div>
                        <div className="w-24 text-center text-gray-600">{t.docs.length}</div>
                        <div className="w-32 text-center">
                          {ok > 0 && <span className="text-green-600 text-xs font-medium mr-1">✓{ok}</span>}
                          {rejected > 0 && <span className="text-red-500 text-xs font-medium">✗{rejected}</span>}
                          {t.docs.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                        <div className="w-24 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setUploadModal({ travellerId: t.traveller_id, name: `${t.first_name} ${t.last_name}` }); }} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"><Upload size={12} /> Upload</button>
                        </div>
                      </div>
                      {/* Expanded document list */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-gray-50/50">
                          {t.docs.length === 0 ? (
                            <p className="text-xs text-gray-400 pl-6">No documents uploaded yet.</p>
                          ) : (
                            <div className="space-y-2 pl-6">
                              {t.docs.map((d: any) => (
                                <div key={d.document_id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2.5">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {getFileIcon(d.file_name)}
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-800 truncate">{d.document_type.replace(/_/g, ' ')}</p>
                                      <p className="text-xs text-gray-400 truncate">{d.file_name} {d.uploaded_at && <span>· {new Date(d.uploaded_at).toLocaleDateString()}</span>}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {d.verification_status === 'REJECTED' ? (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">REJECTED</span>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">UPLOADED</span>
                                    )}
                                    <div className="flex gap-0.5">
                                      {isPreviewable(d.file_name) && <button onClick={() => setPreviewDoc(d)} className="p-1 text-gray-400 hover:text-blue-600" title="View"><Eye size={13} /></button>}
                                      <a href={getDocumentDownloadUrl(d.document_id)} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600" title="Download"><Download size={13} /></a>
                                      {d.verification_status !== 'REJECTED' && <button onClick={() => handleReject(d.document_id)} className="p-1 text-gray-400 hover:text-red-500" title="Reject"><XCircle size={13} /></button>}
                                      <button onClick={() => handleDeleteDoc(d.document_id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {travellers.length === 0 && <p className="text-center text-gray-400 py-6">No travellers.</p>}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => { setUploadModal(null); setUploadFile(null); setUploadProgress(0); }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-gray-900">Upload Document</h2><button onClick={() => { setUploadModal(null); setUploadFile(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <p className="text-sm text-gray-500 mb-4">For: <span className="font-medium text-gray-900">{uploadModal.name}</span></p>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label><select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{DOC_TYPES.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}</select></div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">File (PDF, JPG, PNG)</label>
                <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2"><FileText size={16} className="text-blue-600" /><span className="text-sm font-medium text-gray-700">{uploadFile.name}</span><span className="text-xs text-gray-400">({(uploadFile.size / 1024).toFixed(0)} KB)</span></div>
                  ) : (
                    <div><Upload size={20} className="mx-auto text-gray-300 mb-1" /><p className="text-sm text-gray-500">Click to select file</p><p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p></div>
                  )}
                </button>
                {/* File preview */}
                {uploadFile && uploadFile.type.startsWith('image/') && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 max-h-40 flex items-center justify-center bg-gray-50">
                    <img src={URL.createObjectURL(uploadFile)} alt="Preview" className="max-h-40 object-contain" />
                  </div>
                )}
              </div>
              {/* Upload progress */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}
              <button onClick={handleUpload} disabled={!uploadFile || uploading} className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? `Uploading ${uploadProgress}%...` : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900">{previewDoc.document_type.replace(/_/g, ' ')}</h2>
                <p className="text-xs text-gray-400">{previewDoc.file_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${previewDoc.verification_status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{previewDoc.verification_status === 'REJECTED' ? 'REJECTED' : 'UPLOADED'}</span>
                <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[300px]">
              {previewDoc.file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={getDocumentDownloadUrl(previewDoc.document_id)} className="w-full h-[500px] rounded border border-gray-200" title="PDF Preview" />
              ) : (
                <img src={getDocumentDownloadUrl(previewDoc.document_id)} alt="Document" className="max-w-full max-h-[500px] rounded shadow" />
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                {previewDoc.verification_status !== 'REJECTED' && <button onClick={() => { handleReject(previewDoc.document_id); setPreviewDoc(null); }} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 flex items-center gap-1"><XCircle size={12} /> Reject</button>}
                <a href={getDocumentDownloadUrl(previewDoc.document_id)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 flex items-center gap-1"><Download size={12} /> Download</a>
              </div>
              <button onClick={() => { handleDeleteDoc(previewDoc.document_id); setPreviewDoc(null); }} className="px-3 py-1.5 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-50 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
      <Icon size={16} className={`mx-auto mb-1 ${color}`} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
