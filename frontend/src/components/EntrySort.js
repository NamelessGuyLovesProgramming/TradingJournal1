// src/components/EntrySort.js
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';

const EntrySort = ({ onSortChange }) => {
  const [sortCriteria, setSortCriteria] = React.useState('date-desc');

  const handleChange = (event) => {
    const value = event.target.value;
    setSortCriteria(value);
    onSortChange(value);
  };

  return (
    <Box sx={{ minWidth: 200, mr: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortCriteria}
          label="Sort By"
          onChange={handleChange}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Date
          </Typography>
          <MenuItem value="date-desc">Date (Newest First)</MenuItem>
          <MenuItem value="date-asc">Date (Oldest First)</MenuItem>

          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Result
          </Typography>
          <MenuItem value="result-win">Win</MenuItem>
          <MenuItem value="result-loss">Loss</MenuItem>
          <MenuItem value="result-be">Break Even</MenuItem>
          <MenuItem value="result-pbe">Partial Break Even</MenuItem>

          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Position Type
          </Typography>
          <MenuItem value="position-long">Long</MenuItem>
          <MenuItem value="position-short">Short</MenuItem>

          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Other
          </Typography>
          <MenuItem value="pnl-desc">P&L (High to Low)</MenuItem>
          <MenuItem value="pnl-asc">P&L (Low to High)</MenuItem>
          <MenuItem value="rating-desc">Rating (High to Low)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default EntrySort;