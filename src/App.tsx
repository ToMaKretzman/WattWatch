import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, Container, Tab, Tabs } from '@mui/material';
import { ElectricMeter as MeterIcon } from '@mui/icons-material';
import MeterReading from './components/OCR/MeterReading';
import UtilityPriceInput from './components/UtilityPriceInput';
import { initializeClient } from './services/influxdbClient';
import './App.css';
import { OCRResult } from './services/openai';
import { getLatestReading } from './services/influxdb';
import { MeterReadingForm } from './components/MeterReadingForm';
import { ReadingDisplay } from './components/ReadingDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';

// Erstelle ein dunkleres Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', // Grün für Energieeffizienz
    },
    secondary: {
      main: '#2196f3', // Blau für technische Aspekte
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    h5: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderRadius: '12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [value, setValue] = React.useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestReading, setLatestReading] = useState<OCRResult | null>(null);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeClient();
        const reading = await getLatestReading();
        if (reading) {
          setLatestReading({
            current_reading: { value: reading.value.toString(), confidence: reading.confidence },
            meter_number: { value: reading.meter_number, confidence: 1 },
            unit: { value: reading.unit, confidence: 1 },
            tariff_info: { HT: { value: 'unknown', confidence: 0 }, NT: { value: 'unknown', confidence: 0 } },
            additional_info: { value: 'unknown', confidence: 0 }
          });
        }
      } catch (err) {
        console.error('Fehler bei der Initialisierung:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler bei der Initialisierung');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return <div>Lade...</div>;
  }

  if (error) {
    return <div className="error">Fehler: {error}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <MeterIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              WattWatch
            </Typography>
          </Toolbar>
        </AppBar>

        <Container sx={{ flex: 1, py: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              <Tab label="Zählerstand" {...a11yProps(0)} />
              <Tab label="Preise" {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <ErrorBoundary>
              <div className="App">
                <header className="App-header">
                  <h1>WattWatch</h1>
                  <p>Erfassen Sie Ihren Stromzählerstand</p>
                </header>
                <main>
                  <MeterReadingForm />
                  {latestReading && (
                    <section className="latest-reading">
                      <h2>Letzte Messung</h2>
                      <ReadingDisplay reading={latestReading} />
                    </section>
                  )}
                </main>
              </div>
            </ErrorBoundary>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <UtilityPriceInput />
          </TabPanel>
        </Container>

        <Box 
          component="footer" 
          sx={{ 
            py: 3, 
            px: 2, 
            mt: 'auto',
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            WattWatch - Verbrauchserfassung
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
