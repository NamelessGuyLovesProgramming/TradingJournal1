import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getJournals } from '../api/apiClient';

const JournalContext = createContext();

export const useJournal = () => useContext(JournalContext);

export const JournalProvider = ({ children }) => {
  const [journals, setJournals] = useState([]);
  const [currentJournal, setCurrentJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetchJournals mit useCallback, um die Referenzstabilität zu gewährleisten
  const fetchJournals = useCallback(async () => {
    // Wir setzen loading nur auf true, wenn es noch nicht true ist
    try {
      const response = await getJournals();
      setJournals(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load journals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectJournal = useCallback((journalId) => {
    const journal = journals.find(j => j.id === Number(journalId));
    setCurrentJournal(journal || null);
  }, [journals]);

  // Führe fetchJournals nur einmal beim ersten Rendern aus
  useEffect(() => {
    fetchJournals();
    // fetchJournals ist jetzt eine stabile Referenz und sollte keine Endlosschleife verursachen
  }, [fetchJournals]);

  // Debug-Code zum Nachverfolgen von Renderungen
  console.log("JournalContext rendered, journals:", journals.length);

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