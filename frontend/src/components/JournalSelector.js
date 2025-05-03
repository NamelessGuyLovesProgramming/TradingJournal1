// src/components/JournalSelector.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions
} from '@mui/material';
import { useJournal } from '../contexts/JournalContext';
import JournalForm from './JournalForm';

const JournalSelector = () => {
  const { journals, currentJournal, selectJournal } = useJournal();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const journalId = event.target.value;
    selectJournal(journalId);
    navigate(`/journals/${journalId}`);
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  return (
    <>
      <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 2, bgcolor: 'white', borderRadius: 1 }}>
        <Select
          value={currentJournal?.id || ''}
          onChange={handleChange}
          displayEmpty
        >
          <MenuItem value="" disabled>
            Select Journal
          </MenuItem>
          {journals.map((journal) => (
            <MenuItem key={journal.id} value={journal.id}>
              {journal.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleOpenDialog}
        sx={{ color: 'white' }}
      >
        New Journal
      </Button>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Journal</DialogTitle>
        <DialogContent>
          <JournalForm onComplete={handleCloseDialog} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JournalSelector;