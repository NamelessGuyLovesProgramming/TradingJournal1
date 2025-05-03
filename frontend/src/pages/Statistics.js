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
  Tabs,
  Tab, // NEU: Tabs für verschiedene Statistikansichten
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Bar, Pie, Line } from 'react-chartjs-2'; // NEU: Line-Chart hinzugefügt
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement, // NEU: Für Linien-Charts
  LineElement, // NEU: Für Linien-Charts
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
  Title,
  PointElement, // NEU: Für Linien-Charts
  LineElement, // NEU: Für Linien-Charts
);

// NEU: TabPanel-Komponente für Tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Statistics = () => {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const { journals } = useJournal();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // NEU: State für Tab-Auswahl

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

  // NEU: Handler für Tab-Wechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  // Prepare chart data for the original charts
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

  // NEU: Session-Performance-Daten für Bar-Chart
  const sessionData = {
    labels: stats.session_performance.map(item => item.session),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: stats.session_performance.map(item => item.win_rate),
        backgroundColor: stats.session_performance.map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
        ),
        borderColor: stats.session_performance.map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // NEU: Wochentags-Performance-Daten für Bar-Chart
  const weekdayData = {
    labels: stats.daily_performance.weekdays.map(item => item.day),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: stats.daily_performance.weekdays.map(item => item.win_rate),
        backgroundColor: stats.daily_performance.weekdays.map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
        ),
        borderColor: stats.daily_performance.weekdays.map(item =>
          item.win_rate >= 50 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // NEU: Monats-Performance-Daten für Line-Chart
  const monthlyData = {
    labels: stats.monthly_performance.map(item => item.month_name),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: stats.monthly_performance.map(item => item.win_rate),
        borderColor: 'rgba(52, 152, 219, 1)',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
        tension: 0.1
      },
      {
        label: 'PnL',
        data: stats.monthly_performance.map(item => item.pnl),
        borderColor: 'rgba(46, 204, 113, 1)',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        fill: true,
        tension: 0.1,
        yAxisID: 'y1',
      }
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

  // NEU: Line chart options mit zwei Y-Achsen
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Win Rate (%)'
        }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'PnL'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Win Rate (%)') {
              label += context.parsed.y.toFixed(1) + '%';
            } else {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
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
          Zurück zum Journal
        </Button>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Statistiken: {currentJournal?.name || 'Journal'}
        </Typography>
      </Box>

      {/* NEU: Tabs für verschiedene Statistikansichten */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Übersicht" />
          <Tab label="Sitzungen" />
          <Tab label="Kalender" />
          <Tab label="Checklist Einfluss" />
        </Tabs>

        {/* Übersichts-Tab mit den ursprünglichen Statistiken */}
        <TabPanel value={tabValue} index={0}>
          {/* Overall Performance */}
          <Typography variant="h5" gutterBottom>Gesamtperformance</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Trades insgesamt</Typography>
                  <Typography variant="h3" align="center">{stats.total_trades}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Gewinnrate</Typography>
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
                  <Typography variant="h6" gutterBottom>Durchschnittlicher P&L</Typography>
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
                <Typography variant="subtitle1" gutterBottom>Trade-Ergebnisse</Typography>
                <Box height={250}>
                  <Pie data={resultsData} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Positionsarten</Typography>
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
                  <TableCell>Metrik</TableCell>
                  <TableCell align="right">Wert</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Trades insgesamt</TableCell>
                  <TableCell align="right">{stats.total_trades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gewinnrate</TableCell>
                  <TableCell align="right">{stats.win_rate_percentage.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gewinne</TableCell>
                  <TableCell align="right">{stats.results_count.Win || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Verluste</TableCell>
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
                  <TableCell>Durchschnittlicher P&L</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: stats.average_pnl >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {stats.average_pnl.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Durchschnittlicher Gewinn</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: 'success.main' }}
                  >
                    {stats.average_winning_pnl.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Durchschnittlicher Verlust</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: 'error.main' }}
                  >
                    {stats.average_losing_pnl.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Durchschnittliches initiales R/R</TableCell>
                  <TableCell align="right">
                    {stats.average_initial_rr !== null ? stats.average_initial_rr.toFixed(1) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Long-Positionen</TableCell>
                  <TableCell align="right">{stats.position_type_count.Long || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Short-Positionen</TableCell>
                  <TableCell align="right">{stats.position_type_count.Short || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Symbol Performance */}
          {stats.symbol_performance && stats.symbol_performance.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, mt: 3 }} elevation={2}>
              <Typography variant="h5" gutterBottom>Symbol-Performance</Typography>

              <Box height={300} mb={3}>
                <Bar data={symbolBarData} options={barOptions} />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Anzahl</TableCell>
                      <TableCell align="right">Gewinne</TableCell>
                      <TableCell align="right">Verluste</TableCell>
                      <TableCell align="right">Gewinnrate</TableCell>
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
              <Typography variant="h5" gutterBottom>Strategie-Performance</Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Strategie</TableCell>
                      <TableCell align="right">Anzahl</TableCell>
                      <TableCell align="right">Gewinne</TableCell>
                      <TableCell align="right">Verluste</TableCell>
                      <TableCell align="right">Gewinnrate</TableCell>
                      <TableCell align="right">Durchschn. P&L</TableCell>
                      <TableCell align="right">Gesamt P&L</TableCell>
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
        </TabPanel>

        {/* NEU: Sitzungs-Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>Sitzungsperformance</Typography>
          <Typography variant="body2" paragraph>
            Diese Ansicht zeigt, zu welchen Tageszeiten deine Trading-Performance am besten ist.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box height={300}>
                <Bar data={sessionData} options={barOptions} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tageszeit</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">Gewinne</TableCell>
                      <TableCell align="right">Verluste</TableCell>
                      <TableCell align="right">Gewinnrate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.session_performance.map((item) => (
                      <TableRow key={item.session}>
                        <TableCell>{item.session}</TableCell>
                        <TableCell align="right">{item.total}</TableCell>
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
            </Grid>
          </Grid>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Wochentagsperformance</Typography>
          <Typography variant="body2" paragraph>
            Diese Ansicht zeigt, an welchen Wochentagen deine Trading-Performance am besten ist.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box height={300}>
                <Bar data={weekdayData} options={barOptions} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Wochentag</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">Gewinne</TableCell>
                      <TableCell align="right">Verluste</TableCell>
                      <TableCell align="right">Gewinnrate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.daily_performance.weekdays.map((item) => (
                      <TableRow key={item.day}>
                        <TableCell>{item.day}</TableCell>
                        <TableCell align="right">{item.total}</TableCell>
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
            </Grid>
          </Grid>
        </TabPanel>

        {/* NEU: Kalender-Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>Monatsperformance</Typography>
          <Typography variant="body2" paragraph>
            Diese Ansicht zeigt deine Trading-Performance über verschiedene Monate.
          </Typography>

          <Box height={400} mb={4}>
            <Line data={monthlyData} options={lineOptions} />
          </Box>

          <Typography variant="h5" gutterBottom>Monatsübersicht</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Monat</TableCell>
                  <TableCell align="right">Trades</TableCell>
                  <TableCell align="right">Gewinne</TableCell>
                  <TableCell align="right">Verluste</TableCell>
                  <TableCell align="right">Gewinnrate</TableCell>
                  <TableCell align="right">P&L</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.monthly_performance.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell>{item.month_name}</TableCell>
                    <TableCell align="right">{item.total}</TableCell>
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
                      sx={{ color: item.pnl >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {item.pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Tageskalender</Typography>
          <Typography variant="body2" paragraph>
            Diese Übersicht zeigt die Tage mit Trades und ihre Performance. Grün = positive Tage, Rot = negative Tage.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stats.daily_performance.calendar.map((day) => (
              <Box
                key={day.date}
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: day.win_rate >= 50 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)',
                  color: 'white',
                  borderRadius: 1,
                  fontSize: 12,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  }
                }}
                title={`${day.date}: ${day.wins}/${day.total} Gewinne (${day.win_rate.toFixed(1)}%), P&L: ${day.pnl.toFixed(2)}`}
              >
                {new Date(day.date).getDate()}
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* NEU: Checklist-Einfluss-Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>Einfluss von Checklist-Items auf deine Gewinnrate</Typography>
          <Typography variant="body2" paragraph>
            Diese Analyse zeigt, welche Checklist-Items den größten positiven Einfluss auf deine Trading-Performance haben. Ein höherer Wert bedeutet, dass die Einhaltung dieses Items deine Gewinnrate verbessert.
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Checklist-Item</TableCell>
                  <TableCell align="right">Gewinnrate wenn erfüllt</TableCell>
                  <TableCell align="right">Gewinnrate wenn nicht erfüllt</TableCell>
                  <TableCell align="right">Unterschied</TableCell>
                  <TableCell align="right">Anzahl Trades</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.checklist_win_rates.map((item) => (
                  <TableRow key={item.template_id}>
                    <TableCell>{item.text}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.checked_win_rate >= 50 ? 'success.main' : 'error.main' }}
                    >
                      {item.checked_win_rate.toFixed(1)}% ({item.checked_total} Trades)
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: item.unchecked_win_rate >= 50 ? 'success.main' : 'error.main' }}
                    >
                      {item.unchecked_win_rate.toFixed(1)}% ({item.unchecked_total} Trades)
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 'bold',
                        color: item.win_rate_diff > 0 ? 'success.main' :
                               (item.win_rate_diff < 0 ? 'error.main' : 'text.primary')
                      }}
                    >
                      {item.win_rate_diff > 0 ? '+' : ''}{item.win_rate_diff.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">
                      {item.checked_total + item.unchecked_total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Grafische Darstellung der Checklist-Items mit dem höchsten Einfluss */}
          {stats.checklist_win_rates.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Top Checklist-Items nach Einfluss auf die Gewinnrate
              </Typography>
              <Box height={400}>
                <Bar
                  data={{
                    labels: stats.checklist_win_rates.slice(0, 5).map(item => item.text),
                    datasets: [
                      {
                        label: 'Gewinnrate-Unterschied (%)',
                        data: stats.checklist_win_rates.slice(0, 5).map(item => item.win_rate_diff),
                        backgroundColor: stats.checklist_win_rates.slice(0, 5).map(item =>
                          item.win_rate_diff > 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)'
                        ),
                        borderColor: stats.checklist_win_rates.slice(0, 5).map(item =>
                          item.win_rate_diff > 0 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)'
                        ),
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const value = context.parsed.x;
                            return `Unterschied: ${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Statistics;