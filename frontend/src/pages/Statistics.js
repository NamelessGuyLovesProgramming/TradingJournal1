// src/pages/Statistics.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { getJournalStatistics } from '../api/apiClient';
import { useJournal } from '../contexts/JournalContext';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Statistics = () => {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const { journals } = useJournal();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentJournal = journals.find(j => j.id === Number(journalId));

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await getJournalStatistics(journalId);
        setStats(response.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('No entries found for this journal to calculate statistics');
        } else {
          setError('Failed to load statistics');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (journalId) {
      fetchStatistics();
    }
  }, [journalId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/journals/${journalId}`)}
          >
            Back to Journal
          </Button>
        </Box>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Typography variant="body1" mt={2}>
            Add some trade entries to see statistics and performance analytics.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!stats) {
    return <Typography>No statistics data available</Typography>;
  }

  // Prepare chart data
  const resultsData = {
    labels: ['Win', 'Loss', 'BE', 'Partial BE'],
    datasets: [
      {
        data: [
          stats.results_count.Win || 0,
          stats.results_count.Loss || 0,
          stats.results_count.BE || 0,
          stats.results_count.PartialBE || 0
        ],
        backgroundColor: [
          'rgba(46, 204, 113, 0.7)',
          'rgba(231, 76, 60, 0.7)',
          'rgba(241, 196, 15, 0.7)',
          'rgba(52, 152, 219, 0.7)'
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(231, 76, 60, 1)',
          'rgba(241, 196, 15, 1)',
          'rgba(52, 152, 219, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const positionData = {
    labels: ['Long', 'Short'],
    datasets: [
      {
        data: [
          stats.position_type_count.Long || 0,
          stats.position_type_count.Short || 0
        ],
        backgroundColor: [
          'rgba(46, 204, 113, 0.7)',
          'rgba(231, 76, 60, 0.7)',
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(231, 76, 60, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare symbol performance data for bar chart
  const symbolBarData = {
    labels: stats.symbol_performance.slice(0, 10).map(item => item.symbol),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: stats.symbol_performance.slice(0, 10).map(item => item.win_rate),
        backgroundColor: stats.symbol_performance.slice(0, 10).map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
        ),
        borderColor: stats.symbol_performance.slice(0, 10).map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Win Rate by Symbol (%)'
      }
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/journals/${journalId}`)}
        >
          Back to Journal
        </Button>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Statistics: {currentJournal?.name || 'Journal'}
        </Typography>
      </Box>

      {/* Overall Performance */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" gutterBottom>Overall Performance</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Trades</Typography>
                <Typography variant="h3" align="center">{stats.total_trades}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Win Rate</Typography>
                <Typography
                  variant="h3"
                  align="center"
                  color={stats.win_rate_percentage >= 50 ? 'success.main' : 'error.main'}
                >
                  {stats.win_rate_percentage.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Average P&L</Typography>
                <Typography
                  variant="h3"
                  align="center"
                  color={stats.average_pnl >= 0 ? 'success.main' : 'error.main'}
                >
                  {stats.average_pnl.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Trade Results</Typography>
              <Box height={250}>
                <Pie data={resultsData} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Position Types</Typography>
              <Box height={250}>
                <Pie data={positionData} />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Total Trades</TableCell>
                <TableCell align="right">{stats.total_trades}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Win Rate</TableCell>
                <TableCell align="right">{stats.win_rate_percentage.toFixed(1)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Wins</TableCell>
                <TableCell align="right">{stats.results_count.Win || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Losses</TableCell>
                <TableCell align="right">{stats.results_count.Loss || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Break Even</TableCell>
                <TableCell align="right">{stats.results_count.BE || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Partial Break Even</TableCell>
                <TableCell align="right">{stats.results_count.PartialBE || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average P&L</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: stats.average_pnl >= 0 ? 'success.main' : 'error.main' }}
                >
                  {stats.average_pnl.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average Win P&L</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: 'success.main' }}
                >
                  {stats.average_winning_pnl.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average Loss P&L</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: 'error.main' }}
                >
                  {stats.average_losing_pnl.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average Initial R/R</TableCell>
                <TableCell align="right">
                  {stats.average_initial_rr !== null ? stats.average_initial_rr.toFixed(1) : 'N/A'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Long Positions</TableCell>
                <TableCell align="right">{stats.position_type_count.Long || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Short Positions</TableCell>
                <TableCell align="right">{stats.position_type_count.Short || 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Symbol Performance */}
      {stats.symbol_performance && stats.symbol_performance.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          <Typography variant="h5" gutterBottom>Symbol Performance</Typography>

          <Box height={300} mb={3}>
            <Bar data={symbolBarData} options={barOptions} />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Wins</TableCell>
                  <TableCell align="right">Losses</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.symbol_performance.map((item) => (
                  <TableRow key={item.symbol}>
                    <TableCell component="th" scope="row">
                      {item.symbol}
                    </TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">{item.wins}</TableCell>
                    <TableCell align="right">{item.losses}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.win_rate >= 50 ? 'success.main' : 'error.main' }}
                    >
                      {item.win_rate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Strategy Performance */}
      {stats.strategy_performance && stats.strategy_performance.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          <Typography variant="h5" gutterBottom>Strategy Performance</Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Wins</TableCell>
                  <TableCell align="right">Losses</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell align="right">Avg P&L</TableCell>
                  <TableCell align="right">Total P&L</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.strategy_performance.map((item) => (
                  <TableRow key={item.strategy}>
                    <TableCell component="th" scope="row">
                      {item.strategy}
                    </TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">{item.wins}</TableCell>
                    <TableCell align="right">{item.losses}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.win_rate >= 50 ? 'success.main' : 'error.main' }}
                    >
                      {item.win_rate.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.avg_pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {item.avg_pnl.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.total_pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {item.total_pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Checklist Usage */}
      {stats.checklist_usage && stats.checklist_usage.length > 0 && (
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h5" gutterBottom>Checklist Item Usage</Typography>

          <List>
            {stats.checklist_usage.map((item) => (
              <ListItem key={item.text}>
                <ListItemText
                  primary={item.text}
                  secondary={`${item.checked_count}/${item.total_entries_with_item} entries (${item.checked_percentage.toFixed(1)}%)`}
                />
                <Box
                  sx={{
                    width: 100,
                    height: 10,
                    bgcolor: 'grey.300',
                    borderRadius: 5,
                    mr: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${item.checked_percentage}%`,
                      bgcolor: item.checked_percentage >= 75
                        ? 'success.main'
                        : (item.checked_percentage < 50 ? 'error.main' : 'warning.main'),
                      borderRadius: 5,
                    }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Statistics;