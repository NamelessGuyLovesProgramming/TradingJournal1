// src/pages/JournalDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import { format } from 'date-fns';
import { getEntries, deleteJournal } from '../api/apiClient';
import { useJournal } from '../contexts/JournalContext';
import EntryForm from '../components/EntryForm';
import JournalForm from '../components/JournalForm';
import ChecklistManager from '../components/ChecklistManager';
import EntrySort from '../components/EntrySort';

const JournalDetail = () => {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const { journals, selectJournal } = useJournal();

  const [entries, setEntries] = useState([]);
  const [displayEntries, setDisplayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEntryDialog, setOpenEntryDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openChecklistDialog, setOpenChecklistDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sortCriteria, setSortCriteria] = useState('date-desc');

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await getEntries(journalId);
      const fetchedEntries = response.data;
      setEntries(fetchedEntries);
      // Apply initial sorting
      sortEntries(fetchedEntries, sortCriteria);
      setError(null);
    } catch (err) {
      setError('Failed to load entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journalId) {
      selectJournal(journalId);
      fetchEntries();
    }
  }, [journalId, selectJournal]);

  const currentJournal = journals.find(j => j.id === Number(journalId));

  const sortEntries = (entriesToSort, criteria) => {
    let sortedEntries = [...entriesToSort];

    switch (criteria) {
      case 'date-desc':
        sortedEntries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
        break;
      case 'date-asc':
        sortedEntries.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
        break;
      case 'result-win':
        sortedEntries = sortedEntries.filter(entry => entry.result === 'Win');
        break;
      case 'result-loss':
        sortedEntries = sortedEntries.filter(entry => entry.result === 'Loss');
        break;
      case 'result-be':
        sortedEntries = sortedEntries.filter(entry => entry.result === 'BE');
        break;
      case 'result-pbe':
        sortedEntries = sortedEntries.filter(entry => entry.result === 'PartialBE');
        break;
      case 'position-long':
        sortedEntries = sortedEntries.filter(entry => entry.position_type === 'Long');
        break;
      case 'position-short':
        sortedEntries = sortedEntries.filter(entry => entry.position_type === 'Short');
        break;
      case 'pnl-desc':
        sortedEntries.sort((a, b) => {
          const aPnl = a.pnl ? parseFloat(a.pnl) : 0;
          const bPnl = b.pnl ? parseFloat(b.pnl) : 0;
          return bPnl - aPnl;
        });
        break;
      case 'pnl-asc':
        sortedEntries.sort((a, b) => {
          const aPnl = a.pnl ? parseFloat(a.pnl) : 0;
          const bPnl = b.pnl ? parseFloat(b.pnl) : 0;
          return aPnl - bPnl;
        });
        break;
      case 'rating-desc':
        sortedEntries.sort((a, b) => {
          const aRating = a.trade_rating ? parseFloat(a.trade_rating) : 0;
          const bRating = b.trade_rating ? parseFloat(b.trade_rating) : 0;
          return bRating - aRating;
        });
        break;
      default:
        // Default to newest first
        sortedEntries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
    }

    setDisplayEntries(sortedEntries);
  };

  const handleDeleteJournal = async () => {
    try {
      await deleteJournal(journalId);
      navigate('/');
    } catch (err) {
      setError('Failed to delete journal');
      console.error(err);
    }
  };

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);
    sortEntries(entries, criteria);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Win': return 'success';
      case 'Loss': return 'error';
      case 'BE': return 'warning';
      case 'PartialBE': return 'info';
      default: return 'default';
    }
  };

  const handleCloseEntryDialog = () => {
    setOpenEntryDialog(false);
    fetchEntries();
  };

  const handleCloseSettingsDialog = () => {
    setOpenSettingsDialog(false);
  };

  const handleCloseChecklistDialog = () => {
    setOpenChecklistDialog(false);
  };

  if (loading && !entries.length) {
    return <Typography>Loading entries...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!currentJournal) {
    return <Typography>Journal not found</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {currentJournal.name}
        </Typography>
        <Box>
          <IconButton
            color="primary"
            onClick={() => setOpenChecklistDialog(true)}
            title="Manage Checklist"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => navigate(`/journals/${journalId}/statistics`)}
            title="View Statistics"
          >
            <BarChartIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
            title="Journal löschen"
          >
            <DeleteIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenEntryDialog(true)}
            sx={{ ml: 1 }}
          >
            New Entry
          </Button>
        </Box>
      </Box>

      {/* Sorting Control */}
      <Box display="flex" alignItems="center" mb={3}>
        <EntrySort onSortChange={handleSortChange} />
        <Typography variant="body2" color="text.secondary">
          {displayEntries.length} entries {sortCriteria !== 'date-desc' && sortCriteria !== 'date-asc' ? '(filtered)' : ''}
        </Typography>
      </Box>

      {currentJournal.description && (
        <Typography variant="body1" paragraph>
          {currentJournal.description}
        </Typography>
      )}

      {displayEntries.length === 0 ? (
        <Box textAlign="center" py={5}>
          <Typography variant="h6" gutterBottom>No entries yet</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenEntryDialog(true)}
          >
            Create First Entry
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {displayEntries.map((entry) => (
            <Grid item xs={12} sm={6} md={4} key={entry.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  borderLeft: '5px solid',
                  borderLeftColor: theme => {
                    const resultColor = getResultColor(entry.result);
                    return theme.palette[resultColor]?.main || theme.palette.primary.main;
                  }
                }}
                onClick={() => navigate(`/journals/${journalId}/entries/${entry.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {entry.symbol || 'N/A'}
                    </Typography>
                    <Chip
                      label={entry.position_type || 'N/A'}
                      size="small"
                      color={entry.position_type === 'Long' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {format(new Date(entry.entry_date), 'MMM d, yyyy HH:mm')}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Chip
                      label={entry.result || 'No Result'}
                      size="small"
                      color={getResultColor(entry.result)}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {entry.pnl !== null ? `P&L: ${entry.pnl}` : ''}
                    </Typography>
                  </Box>

                  {entry.strategy && (
                    <Typography variant="body2" mt={1}>
                      Strategy: {entry.strategy}
                    </Typography>
                  )}

                  {currentJournal.has_emotions && entry.emotion && (
                    <Typography variant="body2" mt={1}>
                      Emotion: {entry.emotion}
                    </Typography>
                  )}

                  {currentJournal.has_custom_field && entry.custom_field_value && (
                    <Typography variant="body2" mt={1}>
                      {currentJournal.custom_field_name}: {entry.custom_field_value}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New Entry Dialog */}
      <Dialog
        open={openEntryDialog}
        onClose={handleCloseEntryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>New Trade Entry</DialogTitle>
        <DialogContent>
          <EntryForm
            journalId={Number(journalId)}
            journalSettings={currentJournal}
            onComplete={handleCloseEntryDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Journal Settings Dialog */}
      <Dialog
        open={openSettingsDialog}
        onClose={handleCloseSettingsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Journal Settings</DialogTitle>
        <DialogContent>
          <JournalForm
            journal={currentJournal}
            onComplete={handleCloseSettingsDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Checklist Manager Dialog */}
      <Dialog
        open={openChecklistDialog}
        onClose={handleCloseChecklistDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Checklist</DialogTitle>
        <DialogContent>
          <ChecklistManager
            journalId={Number(journalId)}
            onComplete={handleCloseChecklistDialog}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChecklistDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Journal-Löschdialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Journal löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Bist du sicher, dass du dieses Journal löschen möchtest? Dies kann nicht rückgängig gemacht werden und alle Einträge werden ebenfalls gelöscht.
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ mr: 1 }}>
            Abbrechen
          </Button>
          <Button onClick={handleDeleteJournal} color="error" variant="contained">
            Löschen
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default JournalDetail;