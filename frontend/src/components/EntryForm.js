// src/components/EntryForm.js
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Box,
  Button,
  Slider,
  Rating,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import { format } from 'date-fns';
import { 
  createEntry, 
  updateEntry, 
  getEntry, 
  getStrategies, 
  addStrategy,
  getChecklistTemplates,
  uploadImage,
  deleteImage
} from '../api/apiClient';

const positionTypes = ['Long', 'Short'];
const tradeResults = ['Win', 'Loss', 'BE', 'PartialBE'];
const imageCategories = ['Before', 'After'];

const EntryForm = ({ journalId, entryId, journalSettings, onComplete }) => {
  const [formData, setFormData] = useState({
    entry_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    symbol: '',
    position_type: '',
    strategy: '',
    initial_rr: '',
    pnl: '',
    result: '',
    confidence_level: 50,
    trade_rating: 3,
    notes: '',
    stop_loss: '',
    take_profit: '',
    custom_field_value: '',
    checklist_statuses: {}
  });

  const [strategies, setStrategies] = useState([]);
  const [newStrategy, setNewStrategy] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);
  const [images, setImages] = useState({ Before: [], After: [] });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStrategyInput, setShowStrategyInput] = useState(false);

  // Load entry data for editing
  useEffect(() => {
    const fetchEntryData = async () => {
      if (entryId) {
        try {
          setLoading(true);
          const response = await getEntry(entryId);
          const entry = response.data;
          
          // Format date for the form
          const entryDate = new Date(entry.entry_date);
          const formattedDate = format(entryDate, "yyyy-MM-dd'T'HH:mm");
          
          // Prepare checklist data
          const checklist = {};
          if (entry.checklist_statuses) {
            entry.checklist_statuses.forEach(status => {
              checklist[status.template_id] = status.checked;
            });
          }
          
          // Prepare images
          const entryImages = { Before: [], After: [] };
          if (entry.images) {
            entry.images.forEach(img => {
              if (img.category === 'Before' || img.category === 'After') {
                entryImages[img.category].push(img);
              }
            });
          }
          
          setFormData({
            ...entry,
            entry_date: formattedDate,
            checklist_statuses: checklist,
          });
          
          setImages(entryImages);
        } catch (err) {
          setError('Failed to load entry data');
          console.error(err);
        } finally