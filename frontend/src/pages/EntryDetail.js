// src/pages/EntryDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ImageList,
  ImageListItem,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getEntry, deleteEntry, deleteImage } from '../api/apiClient';
import { useJournal } from '../contexts/JournalContext';
import EntryForm from '../components/EntryForm';

const EntryDetail = () => {
  const { journalId, entryId } = useParams();
  const navigate = useNavigate();
  const { journals } = useJournal();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const currentJournal = journals.find(j => j.id === Number(journalId));

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const response = await getEntry(entryId);
      setEntry(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entryId) {
      fetchEntry();
    }
  }, [entryId]);

  const handleDeleteEntry = async () => {
    try {
      await deleteEntry(entryId);
      navigate(`/journals/${journalId}`);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Failed to delete entry');
    }
  };

  const handleOpenImage = (image) => {
    if (image.file_path) {
      setSelectedImage(image);
      setImageDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    fetchEntry(); // Refresh entry data after edit
  };

  const handleDeleteImage = async (imageId, category) => {
    try {
      await deleteImage(imageId);
      // Update the entry's images directly to avoid a full refetch
      const updatedImages = entry.images.filter(img => img.id !== imageId);
      setEntry({
        ...entry,
        images: updatedImages
      });
    } catch (err) {
      setError('Failed to delete image/link');
      console.error(err);
    }
  };

  if (loading) {
    return <Typography>Loading entry details...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!entry) {
    return <Typography>Entry not found</Typography>;
  }

  const getResultColor = (result) => {
    switch (result) {
      case 'Win': return 'success';
      case 'Loss': return 'error';
      case 'BE': return 'warning';
      case 'PartialBE': return 'info';
      default: return 'default';
    }
  };

  // Get emotion color based on the emotion type
  const getEmotionColor = (emotion) => {
    const positiveEmotions = ['Calm', 'Confident', 'Focused', 'Satisfaction', 'Relief'];
    const negativeEmotions = ['Fear', 'Greed', 'FOMO', 'Revenge', 'Anxiety', 'Frustration', 'Impatience', 'Anger', 'Disappointment'];
    const neutralEmotions = ['Hesitant', 'Boredom', 'Excitement', 'Indecision', 'Overconfidence', 'Neutral'];

    if (positiveEmotions.includes(emotion)) return 'success';
    if (negativeEmotions.includes(emotion)) return 'error';
    return 'info'; // For neutral emotions
  };

  // Group images by category
  const imagesByCategory = {
    Before: entry.images?.filter(img => img.category === 'Before') || [],
    After: entry.images?.filter(img => img.category === 'After') || [],
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/journals/${journalId}`)}
        >
          Back to Journal
        </Button>
        <Box>
          <Button
            startIcon={<EditIcon />}
            onClick={() => setOpenEditDialog(true)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {entry.symbol || 'No Symbol'}
              <Chip
                label={entry.position_type || 'No Position'}
                color={entry.position_type === 'Long' ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Started: {format(new Date(entry.entry_date), 'MMMM d, yyyy h:mm a')}
            </Typography>

            {entry.end_date && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Ended: {format(new Date(entry.end_date), 'MMMM d, yyyy h:mm a')}
              </Typography>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Result</Typography>
                <Chip
                  label={entry.result || 'No Result'}
                  color={getResultColor(entry.result)}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">P&L</Typography>
                <Typography
                  variant="body1"
                  color={entry.pnl > 0 ? 'success.main' : (entry.pnl < 0 ? 'error.main' : 'text.primary')}
                  fontWeight="bold"
                >
                  {entry.pnl !== null ? entry.pnl : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Strategy</Typography>
                <Typography variant="body1">{entry.strategy || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Initial R/R</Typography>
                <Typography variant="body1">{entry.initial_rr !== null ? entry.initial_rr : 'N/A'}</Typography>
              </Grid>

              {/* Risk Percentage field */}
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Risk (%)</Typography>
                <Typography variant="body1">{entry.risk_percentage !== null ? `${entry.risk_percentage}%` : 'N/A'}</Typography>
              </Grid>

              {currentJournal?.has_sl_tp_fields && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Stop Loss</Typography>
                    <Typography variant="body1">{entry.stop_loss !== null ? entry.stop_loss : 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Take Profit</Typography>
                    <Typography variant="body1">{entry.take_profit !== null ? entry.take_profit : 'N/A'}</Typography>
                  </Grid>
                </>
              )}

              {/* Display emotion if enabled and present */}
              {currentJournal?.has_emotions && entry.emotion && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Emotional State</Typography>
                  <Chip
                    label={entry.emotion}
                    color={getEmotionColor(entry.emotion)}
                    size="small"
                  />
                </Grid>
              )}

              {currentJournal?.has_custom_field && entry.custom_field_value && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{currentJournal.custom_field_name}</Typography>
                  <Typography variant="body1">{entry.custom_field_value}</Typography>
                </Grid>
              )}

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Confidence Level</Typography>
                <Typography variant="body1">{entry.confidence_level}%</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Trade Rating</Typography>
                <Rating value={entry.trade_rating || 0} readOnly precision={0.5} />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6">Checklist</Typography>
            {entry.checklist_statuses?.length > 0 ? (
              <List>
                {entry.checklist_statuses.map((status) => (
                  <ListItem key={status.template_id} dense>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {status.checked ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={status.text} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No checklist items available</Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>Notes</Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {entry.notes || 'No notes provided for this trade.'}
        </Typography>
      </Paper>

      {/* Screenshots & Links Section */}
      {(imagesByCategory.Before.length > 0 || imagesByCategory.After.length > 0) && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>Screenshots & Links</Typography>

          <Grid container spacing={3}>
            {/* Before Screenshots and Links */}
            {imagesByCategory.Before.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Before</Typography>
                <ImageList cols={2} gap={8}>
                  {imagesByCategory.Before.map((img) => (
                    <ImageListItem key={img.id} sx={{ cursor: img.file_path ? 'pointer' : 'default' }}>
                      {img.file_path ? (
                        // Regular image
                        <img
                          src={img.file_path}
                          alt="Before Trade Screenshot"
                          loading="lazy"
                          style={{ borderRadius: 4, height: 150, objectFit: 'cover' }}
                          onClick={() => handleOpenImage(img)}
                        />
                      ) : img.link_url ? (
                        // URL link - only show this if there's a link_url
                        <Box
                          sx={{
                            borderRadius: 4,
                            height: 150,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 2
                          }}
                        >
                          <LinkIcon sx={{ mb: 1, color: 'primary.main' }} />
                          <Typography noWrap sx={{ mb: 1, maxWidth: '100%' }}>
                            {img.link_url?.substring(0, 20)}...
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            href={img.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Link
                          </Button>
                        </Box>
                      ) : null}
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.4)',
                          color: 'white',
                          padding: '4px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id, img.category);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
            )}

            {/* After Screenshots and Links */}
            {imagesByCategory.After.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>After</Typography>
                <ImageList cols={2} gap={8}>
                  {imagesByCategory.After.map((img) => (
                    <ImageListItem key={img.id} sx={{ cursor: img.file_path ? 'pointer' : 'default' }}>
                      {img.file_path ? (
                        // Regular image
                        <img
                          src={img.file_path}
                          alt="After Trade Screenshot"
                          loading="lazy"
                          style={{ borderRadius: 4, height: 150, objectFit: 'cover' }}
                          onClick={() => handleOpenImage(img)}
                        />
                      ) : img.link_url ? (
                        // URL link - only show this if there's a link_url
                        <Box
                          sx={{
                            borderRadius: 4,
                            height: 150,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 2
                          }}
                        >
                          <LinkIcon sx={{ mb: 1, color: 'primary.main' }} />
                          <Typography noWrap sx={{ mb: 1, maxWidth: '100%' }}>
                            {img.link_url?.substring(0, 20)}...
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            href={img.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Link
                          </Button>
                        </Box>
                      ) : null}
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.4)',
                          color: 'white',
                          padding: '4px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id, img.category);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Entry</DialogTitle>
        <DialogContent>
          <EntryForm
            journalId={Number(journalId)}
            entryId={Number(entryId)}
            journalSettings={currentJournal}
            onComplete={handleCloseEditDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trade entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteEntry} color="error" variant="contained">
            Delete
          </Button>
        </Box>
      </Dialog>

      {/* Image Lightbox Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
      >
        {selectedImage && selectedImage.file_path && (
          <Box p={1}>
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}
              onClick={() => setImageDialogOpen(false)}
            >
              <CancelIcon />
            </IconButton>
            <img
              src={selectedImage.file_path}
              alt={`${selectedImage.category} Screenshot`}
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default EntryDetail;