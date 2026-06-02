import { useEffect, useState, useRef } from 'react';
import { getRooms, allocateRooms, deleteRoom, removeFromRoom, moveToRoom, getTravellers, getTravellerDocuments, uploadTravellerDocument, getTravellerReadiness } from '../../services/tripops';
import { BedDouble, X, UserMinus, ArrowRight, Trash2, Phone, User, Pencil, ArrowRightLeft, FileText, Upload } from 'lucide-react';

export default function RoomsTab({ tripId }: { tripId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [allTravellers, setAllTravellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [roomType, setRoomType] = useState('DOUBLE');
  const [customCapacity, setCustomCapacity] = useState(2);
  const [strategy, setStrategy] = useState('SAME_GENDER');
  const [allocating, setAllocating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [moveModal, setMoveModal] = useState<{ travellerId: string; fromRoomId: string; name: string } | null>(null);
  const [unallocated, setUnallocated] = useState<any[]>([]);
  const [profileTraveller, setProfileTraveller] = useState<any>(null);
  const [profileDocs, setProfileDocs] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [roomsRes, travRes] = await Promise.all([getRooms(tripId), getTravellers(tripId)]);
      setRooms(roomsRes.data);
      setAllTravellers(travRes.data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [tripId]);

  async function handleAllocate() {
    setAllocating(true);
    try {
      const capacity = roomType === 'CUSTOM' ? customCapacity : undefined;
      const { data } = await allocateRooms(tripId, { room_type: roomType === 'CUSTOM' ? 'DOUBLE' : roomType, capacity, strategy });
      setResult(data);
      await load();
      setWizardStep(3);
    } catch (err: any) { alert(err?.response?.data?.detail || 'Allocation failed'); }
    setAllocating(false);
  }

  async function handleRemoveFromRoom(roomId: string, travellerId: string) {
    try { await removeFromRoom(roomId, travellerId); await load(); } catch {}
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Delete this room and unallocate all occupants?')) return;
    try { await deleteRoom(roomId); await load(); } catch {}
  }

  async function openAssign(roomId: string) {
    setAssignModal(roomId);
    const allocatedIds = new Set(rooms.flatMap((r: any) => r.occupants?.map((o: any) => o.traveller_id) || []));
    setUnallocated(allTravellers.filter((t: any) => !allocatedIds.has(t.traveller_id)));
  }

  async function handleAssign(roomId: string, travellerId: string) {
    try { await moveToRoom(roomId, travellerId); setAssignModal(null); await load(); } catch (err: any) { alert(err?.response?.data?.detail || 'Assignment failed'); }
  }

  async function handleMove(targetRoomId: string) {
    if (!moveModal) return;
    try {
      await removeFromRoom(moveModal.fromRoomId, moveModal.travellerId);
      await moveToRoom(targetRoomId, moveModal.travellerId);
      setMoveModal(null);
      await load();
    } catch (err: any) { alert(err?.response?.data?.detail || 'Move failed'); }
  }

  async function openProfile(traveller: any) {
    setProfileTraveller(traveller);
    setProfileLoading(true);
    try {
      const { data } = await getTravellerDocuments(traveller.traveller_id);
      setProfileDocs(data);
    } catch { setProfileDocs([]); }
    setProfileLoading(false);
  }

  const totalOccupants = rooms.reduce((sum: number, r: any) => sum + (r.occupants?.length || 0), 0);
  const totalCapacity = rooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-32 text-gray-500">Loading rooms...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><b className="text-gray-900">{rooms.length}</b> rooms</span>
          <span><b className="text-gray-900">{totalOccupants}</b>/<b className="text-gray-900">{totalCapacity}</b> beds filled</span>
          {allTravellers.length - totalOccupants > 0 && (
            <span className="text-amber-600 font-medium">{allTravellers.length - totalOccupants} unallocated</span>
          )}
        </div>
        <button onClick={() => { setShowWizard(true); setWizardStep(1); setResult(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <BedDouble size={16} /> Allocate Rooms
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BedDouble size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No rooms allocated</h3>
          <p className="text-sm text-gray-500 mb-4">Use the allocation wizard to automatically assign travellers to rooms.</p>
          <button onClick={() => { setShowWizard(true); setWizardStep(1); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Start Allocation</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: any) => (
            <div key={room.room_id} className="bg-white rounded-lg border border-gray-200 overflow-hidden group">
              {/* Room Header */}
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Room #{room.room_number}</h4>
                  <p className="text-xs text-gray-400">{room.room_type} · {room.gender || 'Mixed'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(() => { const genders = new Set(room.occupants?.map((o: any) => o.gender).filter(Boolean)); return genders.size > 1 ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-700 border border-orange-200" title="Mixed genders in room">⚠ Mixed</span> : null; })()}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(room.occupants?.length || 0) >= room.capacity ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {room.occupants?.length || 0}/{room.capacity}
                  </span>
                  <button onClick={() => handleDeleteRoom(room.room_id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Room"><Trash2 size={13} /></button>
                </div>
              </div>
              {/* Occupants */}
              <div className="px-4 py-3">
                {room.occupants?.length > 0 ? (
                  <div className="space-y-2.5">
                    {room.occupants.map((o: any) => (
                      <div key={o.traveller_id} className="flex items-start justify-between">
                        <button onClick={() => openProfile(o)} className="flex items-start gap-2 text-left hover:bg-blue-50 rounded-md px-1.5 py-1 -mx-1.5 -my-1 transition-colors flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User size={13} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{o.first_name ? `${o.first_name} ${o.last_name || ''}` : o.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {o.gender && <span>{o.gender}</span>}
                              {o.phone && <span className="flex items-center gap-0.5"><Phone size={9} />{o.phone}</span>}
                            </div>
                          </div>
                        </button>
                        <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setMoveModal({ travellerId: o.traveller_id, fromRoomId: room.room_id, name: `${o.first_name} ${o.last_name}` })} className="p-1 text-gray-300 hover:text-blue-600" title="Move to another room"><ArrowRightLeft size={12} /></button>
                          <button onClick={() => handleRemoveFromRoom(room.room_id, o.traveller_id)} className="p-1 text-gray-300 hover:text-red-500" title="Remove from room"><UserMinus size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic py-2">Empty room</p>
                )}
                {(room.occupants?.length || 0) < room.capacity && (
                  <button onClick={() => openAssign(room.room_id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                    <ArrowRight size={11} /> Assign Traveller
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Allocation Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowWizard(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Room Allocation Wizard</h2>
              <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((s) => (<div key={s} className={`flex-1 h-1.5 rounded-full ${wizardStep >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />))}
            </div>
            {wizardStep === 1 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Step 1: Select Occupancy Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'SINGLE', l: 'Single (1)' }, { v: 'DOUBLE', l: 'Double (2)' }, { v: 'TRIPLE', l: 'Triple (3)' }, { v: 'QUAD', l: 'Quad (4)' }, { v: 'CUSTOM', l: 'Custom' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setRoomType(v)} className={`px-3 py-2.5 text-sm rounded-lg border ${roomType === v ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                  ))}
                </div>
                {roomType === 'CUSTOM' && (
                  <div className="mt-3"><label className="text-xs text-gray-600">Capacity (1-10)</label><input type="number" min={1} max={10} value={customCapacity} onChange={(e) => setCustomCapacity(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                )}
                <button onClick={() => setWizardStep(2)} className="w-full mt-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Next</button>
              </div>
            )}
            {wizardStep === 2 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Step 2: Select Allocation Strategy</p>
                <div className="space-y-2">
                  {[{ v: 'SAME_GENDER', l: 'Same Gender' }, { v: 'SAME_FAMILY', l: 'Same Family' }, { v: 'SAME_DEPARTMENT', l: 'Same Department' }, { v: 'SAME_CITY', l: 'Same City' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setStrategy(v)} className={`w-full px-3 py-2.5 text-sm rounded-lg border text-left ${strategy === v ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setWizardStep(1)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Back</button>
                  <button onClick={handleAllocate} disabled={allocating} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">{allocating ? 'Allocating...' : 'Allocate'}</button>
                </div>
              </div>
            )}
            {wizardStep === 3 && result && (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><BedDouble size={24} className="text-green-600" /></div>
                <h3 className="font-semibold text-gray-900 mb-2">Allocation Complete</h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Rooms</p><p className="text-xl font-bold text-gray-900">{result.rooms_created}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Allocated</p><p className="text-xl font-bold text-gray-900">{result.travellers_allocated}</p></div>
                </div>
                <button onClick={() => setShowWizard(false)} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Traveller Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-gray-900">Assign Traveller</h2><button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            {unallocated.length === 0 ? <p className="text-sm text-gray-500">All travellers are allocated.</p> : (
              <div className="space-y-1">{unallocated.map((t: any) => (
                <button key={t.traveller_id} onClick={() => handleAssign(assignModal, t.traveller_id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors flex items-center gap-2">
                  <User size={14} className="text-gray-400" />{t.first_name} {t.last_name} {t.gender && <span className="text-xs text-gray-400 ml-auto">({t.gender})</span>}
                </button>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {/* Move Traveller Modal */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setMoveModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-gray-900">Move {moveModal.name}</h2><button onClick={() => setMoveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <p className="text-sm text-gray-500 mb-3">Select destination room:</p>
            <div className="space-y-1">
              {rooms.filter((r) => r.room_id !== moveModal.fromRoomId && (r.occupants?.length || 0) < r.capacity).map((r) => (
                <button key={r.room_id} onClick={() => handleMove(r.room_id)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors flex justify-between items-center">
                  <span>Room #{r.room_number} <span className="text-gray-400">({r.room_type})</span></span>
                  <span className="text-xs text-gray-400">{r.occupants?.length || 0}/{r.capacity}</span>
                </button>
              ))}
              {rooms.filter((r) => r.room_id !== moveModal.fromRoomId && (r.occupants?.length || 0) < r.capacity).length === 0 && (
                <p className="text-sm text-gray-400">No rooms with available space.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Traveller Profile Modal (from room click) */}
      {profileTraveller && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setProfileTraveller(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{profileTraveller.first_name} {profileTraveller.last_name}</h2>
              <button onClick={() => setProfileTraveller(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="text-gray-900 font-medium">{profileTraveller.gender || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900 font-medium">{profileTraveller.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900 font-medium">{profileTraveller.email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-gray-900 font-medium">{profileTraveller.participation_status || 'INVITED'}</span></div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><FileText size={14} /> Documents</h3>
              {profileLoading ? <p className="text-xs text-gray-400">Loading...</p> : profileDocs.length === 0 ? (
                <p className="text-xs text-gray-400">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {profileDocs.map((d: any) => (
                    <div key={d.document_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-gray-900">{d.document_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-400">{d.file_name} {d.uploaded_at && <span>· {new Date(d.uploaded_at).toLocaleDateString()}</span>}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.verification_status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {d.verification_status === 'REJECTED' ? 'REJECTED' : 'UPLOADED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
