// src/pages/Dashboard.js
import React, { useEffect } from 'react';
import { Typography, Box, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '../contexts/JournalContext';

const Dashboard = () => {
  const { journals, loading, error, fetchJournals } = useJournal();
  const navigate = useNavigate();

  // Korrigiert: Nur einmal beim Mounten fetchen, ohne unnötige Bedingungen
  useEffect(() => {
    // Keine Bedingung mehr, die erneute Abrufe auslösen könnte
  }, []); // Leeres Dependency-Array

  if (loading) {
    return <Typography>Loading journals...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (journals.length === 0) {
    return (
      <Box textAlign="center" py={5}>
        <Typography variant="h5" gutterBottom>Welcome to Trading Journal</Typography>
        <Typography variant="body1" paragraph>
          You don't have any journals yet. Create your first journal to get started!
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => document.querySelector('button[color="secondary"]').click()}
        >
          Create Journal
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Your Trading Journals</Typography>
      <Grid container spacing={3}>
        {journals.map((journal) => (
          <Grid item xs={12} sm={6} md={4} key={journal.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{journal.name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {journal.description || 'No description'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/journals/${journal.id}`)}>
                  View Entries
                </Button>
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={() => navigate(`/journals/${journal.id}/statistics`)}
                >
                  Statistics
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;