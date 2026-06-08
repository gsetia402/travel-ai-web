import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrip, getTripSummary, changeTripStatus } from '../services/tripops';
import { ChevronRight, MapPin, Calendar, Users, DollarSign, ShieldCheck, BedDouble, FileText, UserCheck, AlertTriangle, Link2, Copy, LinkIcon, Unlink, UserPlus } from 'lucide-react';
import { getRegistrationLink, getRegistrationSummary, generateRegistrationLink, deactivateRegistrationLink } from '../services/tripops';
import TravellersTab from './tabs/TravellersTab';
import RoomsTab from './tabs/RoomsTab';
import DocumentsTab from './tabs/DocumentsTab';
import FinancialsTab from './tabs/FinancialsTab';
import CommunicationsTab from './tabs/CommunicationsTab';
import ItineraryTab from './tabs/ItineraryTab';
import DocumentCenterTab from './tabs/DocumentCenterTab';

const tabs = ['Overview', 'Travellers', 'Rooms', 'Documents', 'Financials', 'Communications', 'Itinerary'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REGISTRATION_OPEN: 'bg-blue-100 text-blue-700',
  REGISTRATION_CLOSED: 'bg-indigo-100 text-indigo-700',
  PLANNING: 'bg-purple-100 text-purple-700',
  READY_TO_DEPART: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REGISTRATION_OPEN', 'CANCELLED'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CANCELLED'],
  REGISTRATION_CLOSED: ['PLANNING', 'REGISTRATION_OPEN', 'CANCELLED'],
  PLANNING: ['READY_TO_DEPART', 'CANCELLED'],
  READY_TO_DEPART: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['DRAFT'],
};

function statusLabel(s: string) { return s.replace(/_/g, ' '); }

export default function TripDetailsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [itineraryKey, setItineraryKey] = useState(0);

  async function loadTrip() {
    if (!tripId) return;
    try {
      const [t, s] = await Promise.all([getTrip(tripId), getTripSummary(tripId)]);
      setTrip(t.data);
      setSummary(s.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadTrip(); }, [tripId]);

  useEffect(() => {
    if (activeTab === 'Overview' && tripId) {
      getTripSummary(tripId).then((s) => setSummary(s.data)).catch(() => {});
    }
  }, [activeTab]);



  async function handleStatusChange(newStatus: string) {
    if (!tripId) return;
    try {
      const { data } = await changeTripStatus(tripId, newStatus);
      setTrip(data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to change status');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading trip...</div>;
  if (!trip) return <div className="text-red-500">Trip not found.</div>;

  const currentStatus = trip.status || 'DRAFT';
  const nextStatuses = VALID_TRANSITIONS[currentStatus] || [];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <button onClick={() => navigate('/trips')} className="hover:text-gray-600">Trips</button>
          <ChevronRight size={14} />
          <span className="text-gray-600 truncate">{trip.trip_name}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{trip.trip_name}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{trip.origin_city ? `${trip.origin_city} → ${trip.destination}` : trip.destination} · {trip.days} days · {trip.traveller_count} travellers · ₹{(trip.budget / 1000).toFixed(0)}K budget</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[currentStatus] || STATUS_COLORS.DRAFT}`}>
              {statusLabel(currentStatus)}
            </span>
            {nextStatuses.length > 0 && (
              <select
                className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500"
                value=""
                onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
              >
                <option value="">Change Status →</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-4 sm:mb-6 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: activeTab === 'Overview' ? 'block' : 'none' }}>
          <OverviewSection trip={trip} summary={summary} onNavigate={setActiveTab} />
        </div>
        <div style={{ display: activeTab === 'Travellers' ? 'block' : 'none' }}><TravellersTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Rooms' ? 'block' : 'none' }}><RoomsTab tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Documents' ? 'block' : 'none' }}><MergedDocumentsSection tripId={tripId!} /></div>
        <div style={{ display: activeTab === 'Financials' ? 'block' : 'none' }}><FinancialsTab tripId={tripId!} trip={{ destination: trip.destination, days: trip.days, budget: trip.budget }} /></div>
        <div style={{ display: activeTab === 'Communications' ? 'block' : 'none' }}><CommunicationsTab tripId={tripId!} trip={{ destination: trip.destination, days: trip.days }} /></div>
        <div style={{ display: activeTab === 'Itinerary' ? 'block' : 'none' }}><ItineraryTab key={itineraryKey} tripId={tripId!} trip={{ destination: trip.destination, days: trip.days, budget: trip.budget }} /></div>
      </div>
    </div>
  );
}

function OverviewSection({ trip, summary, onNavigate }: { trip: any; summary: any; onNavigate: (tab: string) => void }) {
  const s = summary || {};

  // --- Registration state ---
  const [regLink, setRegLink] = useState<any>(null);
  const [regSummary, setRegSummary] = useState<any>(null);
  const [regActing, setRegActing] = useState(false);
  const [regCopied, setRegCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getRegistrationLink(trip.trip_id).catch(() => null),
      getRegistrationSummary(trip.trip_id).catch(() => null),
    ]).then(([l, rs]) => {
      if (l) setRegLink(l.data);
      if (rs) setRegSummary(rs.data);
    });
  }, [trip.trip_id]);

  async function handleGenReg() {
    setRegActing(true);
    try { const { data } = await generateRegistrationLink(trip.trip_id); setRegLink(data); } catch {}
    setRegActing(false);
  }
  async function handleDeactReg() {
    if (!regLink?.registration_code) return;
    setRegActing(true);
    try { const { data } = await deactivateRegistrationLink(regLink.registration_code); setRegLink(data); } catch {}
    setRegActing(false);
  }
  function handleCopyReg() {
    if (!regLink) return;
    navigator.clipboard.writeText(`${window.location.origin}/register/${regLink.registration_code}`);
    setRegCopied(true);
    setTimeout(() => setRegCopied(false), 2000);
  }

  const stats = [
    { label: 'Total Assigned', value: s.registered_travellers ?? 0, sub: `of ${s.traveller_count || trip.traveller_count}`, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active', value: s.active_travellers ?? 0, sub: `${s.opted_out_travellers ?? 0} opted out`, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Rooms', value: s.rooms_allocated ?? 0, sub: `${s.unallocated_travellers ?? 0} unallocated`, icon: BedDouble, color: 'text-purple-600 bg-purple-50' },
    { label: 'Documents', value: `${s.approved_consents ?? 0}`, sub: `${s.pending_consents ?? 0} pending`, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Budget Spent', value: `₹${((s.amount_spent || 0) / 1000).toFixed(0)}K`, sub: `of ₹${((s.total_budget || trip.budget) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
    { label: 'Registration', value: `${s.trip_ready_percentage ?? 0}%`, sub: 'profiles complete', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const actions = [
    { label: 'Unallocated Travellers', count: s.unallocated_travellers || 0, action: 'Allocate Rooms', tab: 'Rooms', show: (s.unallocated_travellers || 0) > 0 },
    { label: 'Pending Consents', count: s.pending_consents || 0, action: 'Review', tab: 'Documents', show: (s.pending_consents || 0) > 0 },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Trip Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoCard icon={MapPin} label="Route" value={trip.origin_city ? `${trip.origin_city} → ${trip.destination}` : trip.destination} />
          <InfoCard icon={Calendar} label="Dates" value={`${trip.start_date} → ${trip.end_date}`} />
          <InfoCard icon={DollarSign} label="Budget" value={`₹${(trip.budget / 1000).toFixed(0)}K`} />
          <InfoCard icon={UserCheck} label="Coordinator" value={trip.organization_name} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}><Icon size={16} /></div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {actions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Action Required</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actions.map((a) => (
              <div key={a.label} className="bg-white rounded-lg border border-amber-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.label}: {a.count}</p>
                  </div>
                </div>
                <button onClick={() => onNavigate(a.tab)} className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">{a.action} →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration — merged into Overview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Registration</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 size={16} className="text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm">Registration Link</span>
            </div>
            <div className="flex gap-2">
              {!regLink && (
                <button onClick={handleGenReg} disabled={regActing} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <LinkIcon size={13} /> Generate Link
                </button>
              )}
              {regLink && regLink.active && (
                <>
                  <button onClick={handleCopyReg} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                    <Copy size={13} /> {regCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={handleDeactReg} disabled={regActing} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 disabled:opacity-50">
                    <Unlink size={13} /> Deactivate
                  </button>
                </>
              )}
              {regLink && !regLink.active && (
                <button onClick={handleGenReg} disabled={regActing} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <LinkIcon size={13} /> Re-generate
                </button>
              )}
            </div>
          </div>
          {regLink ? (
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
                {window.location.origin}/register/{regLink.registration_code}
              </code>
              <span className={`px-2 py-1 rounded text-xs font-medium ${regLink.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {regLink.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No registration link generated yet.</p>
          )}
        </div>

        {regSummary && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <Users size={18} className="mx-auto mb-1.5 text-green-600" />
              <p className="text-xl font-bold text-gray-900">{regSummary.total_registered}</p>
              <p className="text-xs text-gray-500">Registered</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <UserPlus size={18} className="mx-auto mb-1.5 text-yellow-600" />
              <p className="text-xl font-bold text-gray-900">{regSummary.pending_registrations}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <ShieldCheck size={18} className="mx-auto mb-1.5 text-blue-600" />
              <p className="text-xl font-bold text-gray-900">{regSummary.registration_completion_percentage}%</p>
              <p className="text-xs text-gray-500">Completion</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MergedDocumentsSection({ tripId }: { tripId: string }) {
  const [subTab, setSubTab] = useState<'traveller' | 'trip'>('traveller');
  return (
    <div className="space-y-4">
      <div className="flex border-b border-gray-200">
        <button onClick={() => setSubTab('traveller')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === 'traveller' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Traveller Documents
        </button>
        <button onClick={() => setSubTab('trip')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === 'trip' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Trip Documents
        </button>
      </div>
      {subTab === 'traveller' && <DocumentsTab tripId={tripId} />}
      {subTab === 'trip' && <DocumentCenterTab tripId={tripId} />}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{label}</p></div>
      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
    </div>
  );
}
