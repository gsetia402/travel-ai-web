import api from '../api/client';

const TOKEN_KEY = 'traveller_token';

export interface TravellerUser {
  traveller_id: string;
  trip_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  department?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_relationship?: string;
  medical_conditions?: string;
  allergies?: string;
  special_requirements?: string;
  dietary_preferences?: string;
  passport_number?: string;
  nationality?: string;
  participation_status?: string;
  membership_status?: string;
  opt_out_reason?: string;
}

export function getTravellerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTravellerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearTravellerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getTravellerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function travellerLogin(phone: string, date_of_birth: string) {
  const { data } = await api.post('/traveller/login', { phone, date_of_birth });
  setTravellerToken(data.access_token);
  return data;
}

export async function travellerMe(): Promise<TravellerUser> {
  const { data } = await api.get('/traveller/me', { headers: authHeaders() });
  return data;
}

export async function travellerProfile(): Promise<TravellerUser> {
  const { data } = await api.get('/traveller/profile', { headers: authHeaders() });
  return data;
}

export async function updateTravellerProfile(updates: any): Promise<TravellerUser> {
  const { data } = await api.put('/traveller/profile', updates, { headers: authHeaders() });
  return data;
}

export async function travellerTrip() {
  const { data } = await api.get('/traveller/trips', { headers: authHeaders() });
  return data;
}

export async function travellerItinerary() {
  const { data } = await api.get('/traveller/itinerary', { headers: authHeaders() });
  return data;
}

export async function travellerRoom() {
  const { data } = await api.get('/traveller/room', { headers: authHeaders() });
  return data;
}

export async function travellerDocuments() {
  const { data } = await api.get('/traveller/documents', { headers: authHeaders() });
  return data;
}

export async function uploadTravellerDocument(documentType: string, file: File) {
  const form = new FormData();
  form.append('document_type', documentType);
  form.append('file', file);
  const { data } = await api.post('/traveller/documents', form, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function travellerCommunications() {
  const { data } = await api.get('/traveller/communications', { headers: authHeaders() });
  return data;
}

export async function markCommunicationRead(communicationId: string) {
  const { data } = await api.post(`/traveller/communications/${communicationId}/read`, {}, { headers: authHeaders() });
  return data;
}

export async function optOutOfTrip(reason?: string) {
  const { data } = await api.post('/traveller/opt-out', { reason: reason || null }, { headers: authHeaders() });
  return data;
}

export async function travellerReadiness() {
  const { data } = await api.get('/traveller/readiness', { headers: authHeaders() });
  return data;
}

// --- Trip Documents (shared by coordinator) ---
export async function travellerTripDocuments() {
  const { data } = await api.get('/traveller/trip-documents', { headers: authHeaders() });
  return data;
}

export function getTravellerTripDocDownloadUrl(documentId: string): string {
  const base = import.meta.env.VITE_TRIPOPS_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://travel-ai-platform-urhu.onrender.com';
  return `${base}/trip-documents/${documentId}/download`;
}
