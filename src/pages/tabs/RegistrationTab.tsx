import { useEffect, useState } from 'react';
import { getRegistrationLink, getRegistrationSummary, generateRegistrationLink, deactivateRegistrationLink } from '../../services/tripops';
import { Link2, Users, UserPlus, Copy, LinkIcon, Unlink } from 'lucide-react';

export default function RegistrationTab({ tripId }: { tripId: string }) {
  const [link, setLink] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const [l, s] = await Promise.all([
        getRegistrationLink(tripId).catch(() => null),
        getRegistrationSummary(tripId).catch(() => null),
      ]);
      if (l) setLink(l.data);
      if (s) setSummary(s.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleGenerate() {
    setActing(true);
    try {
      const { data } = await generateRegistrationLink(tripId);
      setLink(data);
    } catch {}
    setActing(false);
  }

  async function handleDeactivate() {
    if (!link?.registration_code) return;
    setActing(true);
    try {
      const { data } = await deactivateRegistrationLink(link.registration_code);
      setLink(data);
    } catch {}
    setActing(false);
  }

  function handleCopy() {
    if (!link) return;
    const url = `${window.location.origin}/register/${link.registration_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="text-gray-500">Loading registration...</div>;

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Registration Link</h3>
          </div>
          <div className="flex gap-2">
            {!link && (
              <button
                onClick={handleGenerate}
                disabled={acting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <LinkIcon size={13} /> Generate Link
              </button>
            )}
            {link && link.active && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
                >
                  <Copy size={13} /> {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50"
                >
                  <Unlink size={13} /> Deactivate
                </button>
              </>
            )}
            {link && !link.active && (
              <button
                onClick={handleGenerate}
                disabled={acting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <LinkIcon size={13} /> Re-generate Link
              </button>
            )}
          </div>
        </div>

        {link && (
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
              {window.location.origin}/register/{link.registration_code}
            </code>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              link.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {link.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}

        {!link && (
          <p className="text-sm text-gray-500">No registration link generated yet. Click "Generate Link" to create one.</p>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <Users size={20} className="mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{summary.total_registered}</p>
            <p className="text-sm text-gray-500">Registered</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <UserPlus size={20} className="mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold text-gray-900">{summary.pending_registrations}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
              <span className="text-blue-600 font-bold text-sm">{summary.registration_completion_percentage}%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.registration_completion_percentage}%</p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
        </div>
      )}
    </div>
  );
}
