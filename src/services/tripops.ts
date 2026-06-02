import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_TRIPOPS_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// --- Trips ---
export const getTrips = () => api.get('/trips');
export const getTrip = (id: string) => api.get(`/trips/${id}`);
export const getTripSummary = (id: string) => api.get(`/trips/${id}/summary`);
export const getRiskSummary = (id: string) => api.get(`/trips/${id}/risk-summary`);

// --- Travellers ---
export const getTravellers = (tripId: string) => api.get(`/trips/${tripId}/travellers`);
export const getTravellerReadiness = (id: string) => api.get(`/travellers/${id}/readiness`);

// --- Rooms ---
export const getRooms = (tripId: string) => api.get(`/trips/${tripId}/rooms`);

// --- Documents ---
export const getDocumentSummary = (tripId: string) => api.get(`/trips/${tripId}/document-summary`);
export const getDocumentRequirements = (tripId: string) => api.get(`/trips/${tripId}/document-requirements`);
export const getTravellerDocuments = (id: string) => api.get(`/travellers/${id}/documents`);

// --- Financials ---
export const getFinancialSummary = (tripId: string) => api.get(`/trips/${tripId}/financial-summary`);
export const getExpenseBreakdown = (tripId: string) => api.get(`/trips/${tripId}/expense-breakdown`);
export const getExpenses = (tripId: string) => api.get(`/trips/${tripId}/expenses`);
export const getBudgetStatus = (tripId: string) => api.get(`/trips/${tripId}/budget-status`);

// --- Communications ---
export const getCommunications = (tripId: string) => api.get(`/trips/${tripId}/communications`);
export const getCommunicationSummary = (tripId: string) => api.get(`/trips/${tripId}/communication-summary`);
export const sendCommunication = (tripId: string, data: any) => api.post(`/trips/${tripId}/communications`, data);

// --- Registration ---
export const getRegistrationLink = (tripId: string) => api.get(`/trips/${tripId}/registration-link`);
export const getRegistrationSummary = (tripId: string) => api.get(`/trips/${tripId}/registration-summary`);

// --- Consents ---
export const getConsentsSummary = (tripId: string) => api.get(`/trips/${tripId}/summary`);

export default api;
