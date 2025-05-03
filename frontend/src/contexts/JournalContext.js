import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getJournals } from '../api/apiClient';

const JournalContext = createContext();

export const useJournal = () => useContext(JournalContext);

export const JournalProvider = ({ children }) => {
  const [journals, setJournals] = useState([]);
  const [currentJournal, setCurrentJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Verwende einen Ref statt State um Endlosschleifen zu vermeiden
  const fetchedRef = React.useRef(false);

  // fetchJournals mit useCallback, aber ohne Abhängigkeiten
  const fetchJournals = useCallback(async () => {
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
  }, []); // Leeres Abhängigkeitsarray

  const selectJournal = useCallback((journalId) => {
    const journal = journals.find(j => j.id === Number(journalId));
    setCurrentJournal(journal || null);
  }, [journals]);

  // Verwende useRef, um nur einmal abzurufen
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchJournals();
      fetchedRef.current = true;
    }
  }, [fetchJournals]);

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