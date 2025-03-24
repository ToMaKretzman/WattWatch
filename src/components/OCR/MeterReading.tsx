import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  IconButton,
  Stack
} from '@mui/material';
import { 
  ElectricMeter as MeterIcon,
  AccessTime as TimeIcon,
  Speed as AccuracyIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  ElectricBolt as ElectricityIcon,
  LocalDrink as WaterIcon,
  LocalFireDepartment as GasIcon
} from '@mui/icons-material';
import { getAllLatestReadings, saveReading, type ReadingResult } from '../../services/influxdb';
import { WebcamCapture } from '../Camera/WebcamCapture';
import { performOCR } from '../../services/openai';

const getUtilityIcon = (unit: string) => {
  switch (unit.toLowerCase()) {
    case 'kwh':
      return <ElectricityIcon />;
    case 'm³':
      return <WaterIcon />;
    case 'm3':
      return <WaterIcon />;
    default:
      return <MeterIcon />;
  }
};

const getUtilityName = (unit: string) => {
  switch (unit.toLowerCase()) {
    case 'kwh':
      return 'Stromzähler';
    case 'm³':
      return 'Wasserzähler';
    case 'm3':
      return 'Wasserzähler';
    default:
      return 'Zähler';
  }
};

export default function MeterReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<ReadingResult[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLatestReadings = async () => {
    setLoading(true);
    try {
      const results = await getAllLatestReadings();
      setReadings(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      setReadings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestReadings();
  }, []);

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const ocrResult = await performOCR(imageData);
      console.log('OCR Ergebnis:', ocrResult);
      
      await saveReading(ocrResult);
      await fetchLatestReadings();
      
      setIsDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der OCR-Verarbeitung');
      console.error('Fehler bei der Verarbeitung:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsDialogOpen(false);
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            bgcolor: 'error.light',
            color: 'error.contrastText',
            mb: 2
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CameraIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="div">
                  Zählerstand erfassen
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<CameraIcon />}
                onClick={() => setIsDialogOpen(true)}
              >
                Aufnehmen
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {readings.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Letzte Messungen
            </Typography>
            <Grid container spacing={3}>
              {readings.map((reading, index) => (
                <Grid item xs={12} md={6} lg={4} key={reading.meter_number}>
                  <Card elevation={3}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getUtilityIcon(reading.unit)}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {getUtilityName(reading.unit)}
                          </Typography>
                        </Box>

                        <Typography variant="h4" sx={{ textAlign: 'center', color: 'primary.main' }}>
                          {reading.value.toFixed(2)} {reading.unit}
                        </Typography>

                        <Chip
                          icon={<MeterIcon />}
                          label={`Zähler: ${reading.meter_number}`}
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />

                        <Chip
                          icon={<AccuracyIcon />}
                          label={`Genauigkeit: ${(reading.confidence * 100).toFixed(1)}%`}
                          variant="outlined"
                          color={reading.confidence > 0.8 ? 'success' : 'warning'}
                          sx={{ width: '100%' }}
                        />

                        <Chip
                          icon={<TimeIcon />}
                          label={`Erfasst: ${new Date(reading.time).toLocaleString()}`}
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={handleClose}
        fullScreen
        keepMounted={false}
        disablePortal
        aria-labelledby="camera-dialog-title"
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            id="camera-dialog-title"
            aria-label="Kamera schließen"
            onClick={handleClose}
            disabled={isProcessing}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
          <WebcamCapture
            onCapture={handleCapture}
            isProcessing={isProcessing}
          />
        </Box>
      </Dialog>
    </Box>
  );
} 