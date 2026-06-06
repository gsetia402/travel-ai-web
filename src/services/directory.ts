import apiClient from '../api/client';

const token = () => localStorage.getItem('token') || '';
const auth = () => ({ headers: { Authorization: `Bearer ${token()}` } });

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
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' },
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

// --------------- Trip Integration ---------------

export const addGroupToTrip = (tripId: string, groupId: string) =>
  apiClient.post(`/trips/${tripId}/groups/${groupId}`, {}, auth());

export const addTravellerToTrip = (tripId: string, masterId: string) =>
  apiClient.post(`/trips/${tripId}/directory-travellers/${masterId}`, {}, auth());

export const removeTravellerFromTrip = (tripId: string, masterId: string) =>
  apiClient.delete(`/trips/${tripId}/directory-travellers/${masterId}`, auth());

export const listTripDirectoryTravellers = (tripId: string) =>
  apiClient.get(`/trips/${tripId}/directory-travellers`, auth());
