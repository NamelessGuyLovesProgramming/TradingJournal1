import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';
import JournalDetail from './pages/JournalDetail';
import EntryDetail from './pages/EntryDetail';
import Statistics from './pages/Statistics';
import Layout from './components/Layout';
import { JournalProvider } from './contexts/JournalContext';

// Create a theme with trading colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2ecc71',
    },
    error: {
      main: '#e74c3c',
    },
    background: {
      default: '#f4f7f6',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <JournalProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/journals/:journalId" element={<JournalDetail />} />
              <Route path="/journals/:journalId/entries/:entryId" element={<EntryDetail />} />
              <Route path="/journals/:journalId/statistics" element={<Statistics />} />
            </Routes>
          </Layout>
        </Router>
      </JournalProvider>
    </ThemeProvider>
  );
}