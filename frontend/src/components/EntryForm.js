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
  RadioGroup,
  Radio,
  ImageList,
  ImageListItem,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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

// Simplified trading emotions list as requested
const tradingEmotions = [
  'Confidence',
  'Doubt',
  'Frustration',
  'Euphoria',
  'Indifference',
  'Neutral',
  'Revenge Trading',
  'Self-Deception',
  'Impatience',
];

const EntryForm = ({ journalId, entryId, journalSettings, onComplete }) => {
  const [formData, setFormData] = useState({
    entry_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_date: '',
    symbol: '',
    position_type: '',
    strategy: '',
    initial_rr: '',
    risk_percentage: '',
    pnl: '',
    result: '',
    confidence_level: 50,
    trade_rating: 3,
    notes: '',
    stop_loss: '',
    take_profit: '',
    custom_field_value: '',
    emotion: '',
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
  const [uploadType, setUploadType] = useState('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [tempImages, setTempImages] = useState({ Before: [], After: [] });
  const [formUploads, setFormUploads] = useState([]);

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

          // Format end date if it exists
          let formattedEndDate = '';
          if (entry.end_date) {
            const endDate = new Date(entry.end_date);
            formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm");
          }

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
            end_date: formattedEndDate,
            checklist_statuses: checklist,
          });

          setImages(entryImages);
        } catch (err) {
          setError('Failed to load entry data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEntryData();
  }, [entryId]);

  // Load strategies and checklist items
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load strategies
        const strategiesResponse = await getStrategies();
        setStrategies(strategiesResponse.data || []);

        // Load checklist templates
        if (journalId) {
          const checklistResponse = await getChecklistTemplates(journalId);
          setChecklistItems(checklistResponse.data || []);
        }

        setError(null);
      } catch (err) {
        setError('Failed to load form data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [journalId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleChecklistChange = (templateId, checked) => {
    setFormData({
      ...formData,
      checklist_statuses: {
        ...formData.checklist_statuses,
        [templateId]: checked,
      },
    });
  };

  const handleAddStrategy = async () => {
    if (!newStrategy.trim()) return;

    try {
      const response = await addStrategy({ name: newStrategy.trim() });
      setStrategies([...strategies, response.data]);
      setFormData({
        ...formData,
        strategy: response.data.name,
      });
      setNewStrategy('');
      setShowStrategyInput(false);
    } catch (err) {
      setError('Failed to add strategy');
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const category = tabValue === 0 ? 'Before' : 'After';

    // If we have an entryId, upload directly
    if (entryId) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);

      try {
        const response = await uploadImage(entryId, formData);
        const newImage = response.data;

        setImages({
          ...images,
          [category]: [...images[category], newImage],
        });
      } catch (err) {
        setError('Failed to upload image');
        console.error(err);
      }
    } else {
      // No entryId yet, store the file for later upload
      const tempImageId = Date.now();
      const tempImageUrl = URL.createObjectURL(file);

      // Add to temporary images for display
      setTempImages({
        ...tempImages,
        [category]: [...tempImages[category], {
          id: tempImageId,
          file_path: tempImageUrl,
          category: category
        }]
      });

      // Store the file and metadata for later upload
      setFormUploads([
        ...formUploads,
        { id: tempImageId, file, category }
      ]);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;

    const category = tabValue === 0 ? 'Before' : 'After';

    if (entryId) {
      try {
        // Call API to add link
        const response = await fetch(`/api/entries/${entryId}/links`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: linkUrl.trim(),
            category: category
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Update the UI with the new link
          setImages({
            ...images,
            [category]: [...images[category], data],
          });
          setLinkUrl('');
        } else {
          setError(data.error || 'Failed to add link');
        }
      } catch (err) {
        setError('Failed to add link');
        console.error(err);
      }
    } else {
      // Store link for later
      const tempLinkId = Date.now();

      // Add to temporary images for display
      setTempImages({
        ...tempImages,
        [category]: [...tempImages[category], {
          id: tempLinkId,
          link_url: linkUrl,
          category: category
        }]
      });

      // Store the link and metadata for later
      setFormUploads([
        ...formUploads,
        { id: tempLinkId, link: linkUrl, category }
      ]);

      setLinkUrl('');
    }
  };

  const handleDeleteTempImage = (imageId) => {
    // Remove from temp images
    const category = tempImages.Before.find(img => img.id === imageId) ? 'Before' : 'After';

    setTempImages({
      ...tempImages,
      [category]: tempImages[category].filter(img => img.id !== imageId)
    });

    // Remove from uploads
    setFormUploads(formUploads.filter(upload => upload.id !== imageId));
  };

  const handleDeleteImage = async (imageId, category) => {
    if (!window.confirm('Are you sure you want to delete this image/link?')) return;

    try {
      await deleteImage(imageId);
      setImages({
        ...images,
        [category]: images[category].filter(img => img.id !== imageId),
      });
    } catch (err) {
      setError('Failed to delete image/link');
      console.error(err);
    }
  };

  const uploadPendingFiles = async (newEntryId) => {
    const uploadPromises = formUploads.map(async (upload) => {
      if (upload.file) {
        // Upload file
        const fileFormData = new FormData();
        fileFormData.append('image', upload.file);
        fileFormData.append('category', upload.category);

        try {
          await uploadImage(newEntryId, fileFormData);
        } catch (err) {
          console.error('Failed to upload image:', err);
        }
      } else if (upload.link) {
        // Upload link
        try {
          await fetch(`/api/entries/${newEntryId}/links`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: upload.link,
              category: upload.category
            }),
          });
        } catch (err) {
          console.error('Failed to add link:', err);
        }
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let responseData;

      if (entryId) {
        // Update existing entry
        const response = await updateEntry(entryId, formData);
        responseData = response.data;
      } else {
        // Create new entry
        const response = await createEntry(journalId, formData);
        responseData = response.data;

        // Upload all pending files/links
        await uploadPendingFiles(responseData.id);
      }

      if (onComplete) onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Left Column: Core Trade Details */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Start Date & Time"
            type="datetime-local"
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="End Date & Time"
            type="datetime-local"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="e.g., BTC/USD, AAPL, ES1!"
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Position Type</InputLabel>
            <Select
              name="position_type"
              value={formData.position_type}
              onChange={handleChange}
            >
              <MenuItem value="">-- Select --</MenuItem>
              {positionTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" alignItems="center" mt={2} mb={1}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Strategy</InputLabel>
              <Select
                name="strategy"
                value={formData.strategy}
                onChange={handleChange}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {strategies.map(strategy => (
                  <MenuItem key={strategy.id} value={strategy.name}>
                    {strategy.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              onClick={() => setShowStrategyInput(!showStrategyInput)}
              sx={{ ml: 1, minWidth: 40 }}
            >
              +
            </Button>
          </Box>

          {showStrategyInput && (
            <Box display="flex" mb={2}>
              <TextField
                fullWidth
                label="New Strategy"
                value={newStrategy}
                onChange={(e) => setNewStrategy(e.target.value)}
                size="small"
              />
              <Button onClick={handleAddStrategy} sx={{ ml: 1 }}>
                Add
              </Button>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Initial Risk/Reward"
                name="initial_rr"
                type="number"
                step="0.1"
                value={formData.initial_rr}
                onChange={handleChange}
                helperText="e.g., 1.5 for 1:1.5"
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Risk Percentage (%)"
                name="risk_percentage"
                type="number"
                step="0.01"
                value={formData.risk_percentage}
                onChange={handleChange}
                helperText="e.g., 1.5 for 1.5% account risk"
                margin="normal"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="P&L"
                name="pnl"
                type="number"
                step="any"
                value={formData.pnl}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>

          <FormControl fullWidth margin="normal">
            <InputLabel>Result</InputLabel>
            <Select
              name="result"
              value={formData.result}
              onChange={handleChange}
            >
              <MenuItem value="">-- Select --</MenuItem>
              {tradeResults.map(result => (
                <MenuItem key={result} value={result}>{result}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {journalSettings?.has_sl_tp_fields && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Stop Loss"
                  name="stop_loss"
                  type="number"
                  step="any"
                  value={formData.stop_loss}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Take Profit"
                  name="take_profit"
                  type="number"
                  step="any"
                  value={formData.take_profit}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}

          {/* Emotions Field */}
          {journalSettings?.has_emotions && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Emotional State</InputLabel>
              <Select
                name="emotion"
                value={formData.emotion}
                onChange={handleChange}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {tradingEmotions.map(emotion => (
                  <MenuItem key={emotion} value={emotion}>{emotion}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {journalSettings?.has_custom_field && (
            <FormControl fullWidth margin="normal">
              <InputLabel>{journalSettings.custom_field_name || 'Custom Field'}</InputLabel>
              <Select
                name="custom_field_value"
                value={formData.custom_field_value}
                onChange={handleChange}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {journalSettings.custom_field_options?.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box mt={2}>
            <Typography gutterBottom>Confidence Level: {formData.confidence_level}%</Typography>
            <Slider
              name="confidence_level"
              value={formData.confidence_level}
              onChange={(e, newValue) =>
                setFormData({...formData, confidence_level: newValue})
              }
              step={1}
              min={1}
              max={100}
            />
          </Box>

          <Box mt={2}>
            <Typography gutterBottom>Trade Rating</Typography>
            <Rating
              name="trade_rating"
              value={Number(formData.trade_rating)}
              onChange={(e, newValue) =>
                setFormData({...formData, trade_rating: newValue})
              }
              precision={0.5}
            />
          </Box>

          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />
        </Grid>

        {/* Right Column: Checklist & Images */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Checklist
          </Typography>

          {checklistItems.length === 0 ? (
            <Typography color="text.secondary">
              No checklist items defined for this journal
            </Typography>
          ) : (
            <FormGroup>
              {checklistItems.sort((a, b) => a.order - b.order).map(item => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      checked={!!formData.checklist_statuses[item.id]}
                      onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                    />
                  }
                  label={item.text}
                />
              ))}
            </FormGroup>
          )}

          {/* Image/Link upload section - now available for both new and existing entries */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Screenshots & Links
          </Typography>

          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Before" />
            <Tab label="After" />
          </Tabs>

          <Box>
            <RadioGroup
              row
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
            >
              <FormControlLabel value="file" control={<Radio />} label="Upload File" />
              <FormControlLabel value="link" control={<Radio />} label="Add Link" />
            </RadioGroup>

            {uploadType === 'file' ? (
              <>
                <input
                  accept="image/*"
                  id="image-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="contained"
                    component="span"
                  >
                    Upload {tabValue === 0 ? 'Before' : 'After'} Image
                  </Button>
                </label>
              </>
            ) : (
              <Box display="flex" alignItems="center" mt={1}>
                <TextField
                  fullWidth
                  label={`${tabValue === 0 ? 'Before' : 'After'} URL`}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  size="small"
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  variant="contained"
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  sx={{ ml: 1 }}
                >
                  Add Link
                </Button>
              </Box>
            )}
          </Box>

          {/* Display permanent images for existing entry */}
          {entryId && images[tabValue === 0 ? 'Before' : 'After'].length > 0 && (
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {images[tabValue === 0 ? 'Before' : 'After'].map(image => (
                <Grid item xs={6} key={image.id}>
                  <Box position="relative">
                    {image.file_path ? (
                      <img
                        src={image.file_path}
                        alt={`${image.category} Screenshot`}
                        style={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                    ) : image.link_url ? (
                      <Box
                        sx={{
                          width: '100%',
                          height: 150,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 4,
                          p: 1
                        }}
                      >
                        <Typography noWrap variant="body2" sx={{ mb: 1, width: '100%', textAlign: 'center' }}>
                          {image.link_url?.substring(0, 30)}...
                        </Typography>
                        <Button
                          size="small"
                          href={image.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                        >
                          View Link
                        </Button>
                      </Box>
                    ) : null}
                    <Button
                      size="small"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: 30,
                        p: 0
                      }}
                      onClick={() => handleDeleteImage(image.id, image.category)}
                    >
                      X
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Display temporary images for new entry */}
          {!entryId && tempImages[tabValue === 0 ? 'Before' : 'After'].length > 0 && (
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {tempImages[tabValue === 0 ? 'Before' : 'After'].map(image => (
                <Grid item xs={6} key={image.id}>
                  <Box position="relative">
                    {image.file_path ? (
                      <img
                        src={image.file_path}
                        alt={`${image.category} Screenshot`}
                        style={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                    ) : image.link_url ? (
                      <Box
                        sx={{
                          width: '100%',
                          height: 150,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 4,
                          p: 1
                        }}
                      >
                        <Typography noWrap variant="body2" sx={{ mb: 1, width: '100%', textAlign: 'center' }}>
                          {image.link_url?.substring(0, 30)}...
                        </Typography>
                        <Button
                          size="small"
                          href={image.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                        >
                          View Link
                        </Button>
                      </Box>
                    ) : null}
                    <Button
                      size="small"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: 30,
                        p: 0
                      }}
                      onClick={() => handleDeleteTempImage(image.id)}
                    >
                      X
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : (entryId ? 'Update Entry' : 'Create Entry')}
        </Button>
      </Box>
    </form>
  );
};

export default EntryForm;