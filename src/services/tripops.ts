import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_TRIPOPS_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Trips ---
export const getTrips = () => api.get('/trips');
export const getTrip = (id: string) => api.get(`/trips/${id}`);
export const createTrip = (data: any) => api.post('/trips', data);
export const updateTrip = (id: string, data: any) => api.put(`/trips/${id}`, data);
export const deleteTrip = (id: string) => api.delete(`/trips/${id}`);
export const getTripSummary = (id: string) => api.get(`/trips/${id}/summary`);
export const getRiskSummary = (id: string) => api.get(`/trips/${id}/risk-summary`);

// --- Travellers ---
export const getTravellers = (tripId: string) => api.get(`/trips/${tripId}/travellers`);
export const createTraveller = (tripId: string, data: any) => api.post(`/trips/${tripId}/travellers`, data);
export const uploadTravellersCsv = (tripId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/trips/${tripId}/travellers/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
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
export const generateRegistrationLink = (tripId: string) => api.post(`/trips/${tripId}/registration-link`);
export const deactivateRegistrationLink = (code: string) => api.post(`/registration-links/${code}/deactivate`);
export const getRegistrationSummary = (tripId: string) => api.get(`/trips/${tripId}/registration-summary`);

// --- Consents ---
export const getConsentsSummary = (tripId: string) => api.get(`/trips/${tripId}/summary`);

// --- Itinerary ---
export const getTripItinerary = (tripId: string) => api.get(`/trips/${tripId}/itinerary`);
export const saveTripItinerary = (tripId: string, data: any) => api.post(`/trips/${tripId}/itinerary`, data);
export const updateTripItinerary = (tripId: string, data: any) => api.put(`/trips/${tripId}/itinerary`, data);

// --- AI (existing endpoints) ---
export const generateAIItinerary = (data: any) => api.post('/itinerary', data);
export const getAIWeather = (data: any) => api.post('/weather', data);
export const getAIBudget = (data: any) => api.post('/budget', data);
export const getAIPlanTrip = (data: any) => api.post('/plan-trip', data);

export default api;
