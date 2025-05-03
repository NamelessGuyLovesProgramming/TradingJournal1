import React, { createContext, useState, useEffect, useContext } from 'react';
import { getJournals } from '../api/apiClient';

const JournalContext = createContext();

export const useJournal = () => useContext(JournalContext);

export const JournalProvider = ({ children }) => {
  const [journals, setJournals] = useState([]);
  const [currentJournal, setCurrentJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await getJournals();
      setJournals(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load journals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectJournal = (journalId) => {
    const journal = journals.find(j => j.id === Number(journalId));
    setCurrentJournal(journal || null);
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  return (
    <JournalContext.Provider
      value={{
        journals,
        currentJournal,
        loading,
        error,
        fetchJournals,
        selectJournal,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};