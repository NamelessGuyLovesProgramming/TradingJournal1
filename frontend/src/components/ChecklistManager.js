// src/components/ChecklistManager.js - Corrected version
import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getJournal,
  addChecklistTemplate,
  deleteChecklistTemplate
} from '../api/apiClient';

const ChecklistManager = ({ journalId, onComplete }) => {
  const [templates, setTemplates] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Get templates from journal data instead of direct template endpoint
      const response = await getJournal(journalId);
      const journalData = response.data;

      // Use checklist_templates from journal data
      if (journalData && journalData.checklist_templates) {
        setTemplates(journalData.checklist_templates.sort((a, b) => a.order - b.order));
      } else {
        setTemplates([]);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load checklist templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journalId) {
      fetchTemplates();
    }
  }, [journalId]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    
    try {
      await addChecklistTemplate(journalId, { text: newItemText.trim() });
      setNewItemText('');
      await fetchTemplates();
    } catch (err) {
      setError('Failed to add checklist item');
      console.error(err);
    }
  };

  const handleDeleteItem = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this checklist item?')) return;
    
    try {
      await deleteChecklistTemplate(journalId, templateId);
      await fetchTemplates();
    } catch (err) {
      setError('Failed to delete checklist item');
      console.error(err);
    }
  };

  if (loading && templates.length === 0) {
    return <Typography>Loading checklist items...</Typography>;
  }

  return (
    <Box>
      {error && <Typography color="error">{error}</Typography>}
      
      <List sx={{ mb: 3 }}>
        {templates.length === 0 ? (
          <Typography color="text.secondary">No checklist items have been added yet.</Typography>
        ) : (
          templates.map((template) => (
            <ListItem
              key={template.id}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteItem(template.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
              divider
            >
              <ListItemText primary={template.text} />
            </ListItem>
          ))
        )}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Add New Checklist Item
      </Typography>
      
      <Box display="flex" alignItems="center">
        <TextField
          fullWidth
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="New checklist item"
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddItem}
          sx={{ ml: 1, whiteSpace: 'nowrap' }}
        >
          Add Item
        </Button>
      </Box>
    </Box>
  );
};

export default ChecklistManager;