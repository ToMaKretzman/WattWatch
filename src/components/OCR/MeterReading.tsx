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
  IconButton
} from '@mui/material';
import { 
  ElectricMeter as MeterIcon,
  AccessTime as TimeIcon,
  Speed as AccuracyIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getLatestReading, saveReading } from '../../services/influxdb';
import { WebcamCapture } from '../Camera/WebcamCapture';
import { performOCR } from '../../services/openai';

export default function MeterReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<{
    value: number;
    meter_number: string;
    unit: string;
    confidence: number;
    time: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLatestReading = async () => {
    setLoading(true);
    try {
      const result = await getLatestReading();
      setReading(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      setReading(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestReading();
  }, []);

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const ocrResult = await performOCR(imageData);
      console.log('OCR Ergebnis:', ocrResult);
      
      // Speichere das Ergebnis in InfluxDB
      await saveReading(ocrResult);
      
      // Aktualisiere die Anzeige
      await fetchLatestReading();
      
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
      maxWidth: '600px',
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

      <Grid container spacing={2}>
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
                sx={{ mb: 2 }}
                onClick={() => setIsDialogOpen(true)}
              >
                Aufnehmen
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {reading && (
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MeterIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5" component="div">
                    Letzte Messung
                  </Typography>
                </Box>

                <Typography variant="h3" sx={{ textAlign: 'center', my: 3, color: 'primary.main' }}>
                  {reading.value.toFixed(2)} {reading.unit}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      icon={<MeterIcon />}
                      label={`Zähler: ${reading.meter_number}`}
                      variant="outlined"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      icon={<AccuracyIcon />}
                      label={`Genauigkeit: ${(reading.confidence * 100).toFixed(1)}%`}
                      variant="outlined"
                      color={reading.confidence > 0.8 ? 'success' : 'warning'}
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      icon={<TimeIcon />}
                      label={`Erfasst: ${new Date(reading.time).toLocaleString()}`}
                      variant="outlined"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
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