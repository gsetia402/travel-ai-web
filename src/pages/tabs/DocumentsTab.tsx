import { useEffect, useState } from 'react';
import { getDocumentSummary, getTravellers, getTravellerDocuments } from '../../services/tripops';
import { FileCheck, FileX, FileClock } from 'lucide-react';

export default function DocumentsTab({ tripId }: { tripId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([getDocumentSummary(tripId), getTravellers(tripId)]);
        setSummary(s.data);

        const enriched = await Promise.all(
          t.data.map(async (tr: any) => {
            let docs: any[] = [];
            try {
              const { data } = await getTravellerDocuments(tr.traveller_id);
              docs = data;
            } catch {}
            return { ...tr, docs };
          })
        );
        setTravellers(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <div className="text-gray-500">Loading documents...</div>;

  return (
    <div>
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard icon={FileClock} label="Required" value={summary.required_documents} color="text-gray-600" />
          <StatCard icon={FileCheck} label="Uploaded" value={summary.uploaded_documents} color="text-blue-600" />
          <StatCard icon={FileCheck} label="Verified" value={summary.verified_documents} color="text-green-600" />
          <StatCard icon={FileClock} label="Pending" value={summary.pending_documents} color="text-yellow-600" />
          <StatCard icon={FileX} label="Missing" value={summary.missing_documents} color="text-red-600" />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Traveller</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Documents</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {travellers.map((t) => (
              <tr key={t.traveller_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{t.docs.length} uploaded</td>
                <td className="px-4 py-3">
                  {t.docs.length > 0 ? (
                    <span className="text-green-600 text-xs font-medium">Has docs</span>
                  ) : (
                    <span className="text-red-500 text-xs font-medium">No docs</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
