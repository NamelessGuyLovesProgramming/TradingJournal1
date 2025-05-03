// src/components/JournalForm.js
import React, { useState } from 'react';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { createJournal, updateJournal } from '../api/apiClient';
import { useJournal } from '../contexts/JournalContext';

const JournalForm = ({ journal, onComplete }) => {
  const { fetchJournals } = useJournal();
  const [formData, setFormData] = useState({
    name: journal?.name || '',
    description: journal?.description || '',
    has_sl_tp_fields: journal?.has_sl_tp_fields || false,
    has_custom_field: journal?.has_custom_field || false,
    custom_field_name: journal?.custom_field_name || '',
    custom_field_options: journal?.custom_field_options ? journal.custom_field_options.join('\n') : '',
    has_emotions: journal?.has_emotions || false, // New field for emotions tracking
    checklist_templates: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        custom_field_options: formData.has_custom_field && formData.custom_field_options
          ? formData.custom_field_options.split('\n').filter(line => line.trim())
          : [],
      };

      // Add checklist templates if provided and this is a new journal
      if (!journal && formData.checklist_templates) {
        data.checklist_templates = formData.checklist_templates
          .split('\n')
          .filter(line => line.trim());
      }

      if (journal) {
        await updateJournal(journal.id, data);
      } else {
        await createJournal(data);
      }

      await fetchJournals();
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save journal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Journal Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_sl_tp_fields}
                onChange={handleChange}
                name="has_sl_tp_fields"
              />
            }
            label="Show Stop Loss/Take Profit Fields"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_emotions}
                onChange={handleChange}
                name="has_emotions"
              />
            }
            label="Track Trading Emotions"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_custom_field}
                onChange={handleChange}
                name="has_custom_field"
              />
            }
            label="Add Custom Field"
          />
        </Grid>

        {formData.has_custom_field && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom Field Name"
                name="custom_field_name"
                value={formData.custom_field_name}
                onChange={handleChange}
                margin="normal"
                placeholder="e.g., Market Phase, Timeframe, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom Field Options (one per line)"
                name="custom_field_options"
                value={formData.custom_field_options}
                onChange={handleChange}
                multiline
                rows={3}
                margin="normal"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </Grid>
          </>
        )}

        {!journal && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Default Checklist Items (one per line)
            </Typography>
            <TextField
              fullWidth
              name="checklist_templates"
              value={formData.checklist_templates}
              onChange={handleChange}
              multiline
              rows={5}
              margin="normal"
              placeholder="Trade with the overall trend?&#10;Trade with the 15-minute trend?&#10;..."
            />
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (journal ? 'Update Journal' : 'Create Journal')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default JournalForm;