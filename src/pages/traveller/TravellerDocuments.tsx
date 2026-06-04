import { useEffect, useState, useRef } from 'react';
import { travellerDocuments, uploadTravellerDocument } from '../../services/traveller';
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

const DOC_TYPES = ['PASSPORT', 'VISA', 'GOVERNMENT_ID', 'ID_PROOF', 'STUDENT_ID', 'INSURANCE', 'MEDICAL_CERTIFICATE', 'VACCINATION', 'CONSENT_FORM', 'FLIGHT_TICKET', 'TRAVEL_PERMIT', 'OTHER'];

const STATUS_STYLE: Record<string, { icon: any; color: string }> = {
  VERIFIED: { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  REJECTED: { icon: XCircle, color: 'text-red-600 bg-red-50' },
  UPLOADED: { icon: Clock, color: 'text-amber-600 bg-amber-50' },
  PENDING: { icon: Clock, color: 'text-gray-500 bg-gray-50' },
};

export default function TravellerDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('ID_PROOF');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try { const d = await travellerDocuments(); setDocs(d); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadTravellerDocument(docType, file);
      await load();
    } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText size={20} className="text-indigo-600" /> Documents</h2>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Upload Document</p>
        <div className="flex gap-2">
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <label className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Document list */}
      {docs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: any) => {
            const st = STATUS_STYLE[doc.verification_status] || STATUS_STYLE.PENDING;
            const Icon = st.icon;
            return (
              <div key={doc.document_id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{doc.document_type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                  {doc.verification_status === 'REJECTED' && doc.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5">Reason: {doc.rejection_reason}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.verification_status === 'VERIFIED' ? 'bg-green-50 text-green-700' : doc.verification_status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {doc.verification_status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
