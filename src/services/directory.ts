import apiClient from '../api/client';
import { getToken } from './auth';

const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// --------------- Traveller Master ---------------

export const listMasterTravellers = (search?: string) =>
  apiClient.get('/travellers/master', { ...auth(), params: search ? { search } : {} });

export const createMasterTraveller = (data: any) =>
  apiClient.post('/travellers/master', data, auth());

export const getMasterTraveller = (id: string) =>
  apiClient.get(`/travellers/master/${id}`, auth());

export const updateMasterTraveller = (id: string, data: any) =>
  apiClient.put(`/travellers/master/${id}`, data, auth());

export const deleteMasterTraveller = (id: string) =>
  apiClient.delete(`/travellers/master/${id}`, auth());

export const importMasterTravellersCSV = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post('/travellers/master/import-csv', fd, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' },
  });
};

// --------------- Groups ---------------

export const listGroups = () =>
  apiClient.get('/groups', auth());

export const createGroup = (data: { name: string; description?: string }) =>
  apiClient.post('/groups', data, auth());

export const getGroupDetail = (groupId: string) =>
  apiClient.get(`/groups/${groupId}`, auth());

export const updateGroup = (groupId: string, data: { name?: string; description?: string }) =>
  apiClient.put(`/groups/${groupId}`, data, auth());

export const deleteGroup = (groupId: string) =>
  apiClient.delete(`/groups/${groupId}`, auth());

// --------------- Group Membership ---------------

export const addGroupMembers = (groupId: string, masterIds: string[]) =>
  apiClient.post(`/groups/${groupId}/members`, masterIds, auth());

export const removeGroupMember = (groupId: string, masterId: string) =>
  apiClient.delete(`/groups/${groupId}/members/${masterId}`, auth());

export const createTravellerInGroup = (groupId: string, data: any) =>
  apiClient.post(`/groups/${groupId}/add-traveller`, data, auth());

export const importCsvIntoGroup = (groupId: string, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post(`/groups/${groupId}/import-csv`, fd, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' },
  });
};

// --------------- Trip Integration ---------------

export const addGroupToTrip = (tripId: string, groupId: string) =>
  apiClient.post(`/trips/${tripId}/groups/${groupId}`, {}, auth());

export const syncDirectoryToTrip = (tripId: string) =>
  apiClient.post(`/trips/${tripId}/sync-directory`, {}, auth());

export const addTravellerToTrip = (tripId: string, masterId: string) =>
  apiClient.post(`/trips/${tripId}/directory-travellers/${masterId}`, {}, auth());

export const removeTravellerFromTrip = (tripId: string, masterId: string) =>
  apiClient.delete(`/trips/${tripId}/directory-travellers/${masterId}`, auth());

export const listTripDirectoryTravellers = (tripId: string) =>
  apiClient.get(`/trips/${tripId}/directory-travellers`, auth());
