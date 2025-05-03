import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Journal API methods
export const getJournals = () => apiClient.get('/journals');
export const getJournal = (id) => apiClient.get(`/journals/${id}`);
export const createJournal = (data) => apiClient.post('/journals', data);
export const updateJournal = (id, data) => apiClient.put(`/journals/${id}`, data);
export const deleteJournal = (id) => apiClient.delete(`/journals/${id}`);

// Entries API methods
export const getEntries = (journalId) => apiClient.get(`/journals/${journalId}/entries`);
export const getEntry = (id) => apiClient.get(`/entries/${id}`);
export const createEntry = (journalId, data) => apiClient.post(`/journals/${journalId}/entries`, data);
export const updateEntry = (id, data) => apiClient.put(`/entries/${id}`, data);
export const deleteEntry = (id) => apiClient.delete(`/entries/${id}`);

// Checklist API methods
export const getChecklistTemplates = (journalId) => apiClient.get(`/journals/${journalId}/checklist_templates`);
export const addChecklistTemplate = (journalId, data) => apiClient.post(`/journals/${journalId}/checklist_templates`, data);
export const updateChecklistStatus = (entryId, templateId, checked) => 
  apiClient.put(`/entries/${entryId}/checklist/${templateId}`, { checked });
export const deleteChecklistTemplate = (journalId, templateId) => 
  apiClient.delete(`/journals/${journalId}/checklist_templates/${templateId}`);

// Strategy API methods
export const getStrategies = () => apiClient.get('/strategies');
export const addStrategy = (data) => apiClient.post('/strategies', data);

// Image upload API methods
export const uploadImage = (entryId, formData) => 
  apiClient.post(`/entries/${entryId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
export const deleteImage = (id) => apiClient.delete(`/images/${id}`);

// Statistics API methods
export const getJournalStatistics = (journalId) => apiClient.get(`/journals/${journalId}/statistics`);

export default apiClient;