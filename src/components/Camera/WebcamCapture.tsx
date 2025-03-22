import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import { Camera } from '@mui/icons-material';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isProcessing = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debugMessage, setDebugMessage] = useState<string>('');

  // Überprüfe Browser-Kompatibilität
  useEffect(() => {
    const checkBrowserSupport = () => {
      const userAgent = navigator.userAgent;
      console.log('UserAgent:', userAgent);
      setDebugMessage('Kamera bereit');
    };

    checkBrowserSupport();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('Keine Datei ausgewählt');
      return;
    }

    console.log('Datei ausgewählt:', file.name);
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      console.log('Bild erfolgreich eingelesen');
      onCapture(base64Data);
    };

    reader.onerror = () => {
      console.error('Fehler beim Einlesen der Datei');
      setDebugMessage('Fehler beim Einlesen der Datei');
    };

    reader.readAsDataURL(file);
  };

  const capture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '100vw',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: '#000'
    }}>
      {/* Debug-Informationen */}
      <Typography 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(0,0,0,0.8)',
          color: 'white',
          p: 2,
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000
        }}
      >
        {debugMessage}
      </Typography>

      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Native Kamera Input (versteckt) */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Zentrierte Anleitung */}
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white',
            textAlign: 'center',
            px: 2
          }}
        >
          Klicken Sie auf "Aufnehmen", um ein Foto mit der Kamera zu machen
        </Typography>
      </Box>

      {/* Steuerungselemente */}
      <Box sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 2,
        zIndex: 1000
      }}>
        <Button
          variant="contained"
          color="primary"
          onClick={capture}
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={24} /> : <Camera />}
          sx={{ fontSize: '1.2rem', py: 1.5 }}
        >
          {isProcessing ? 'Verarbeite...' : 'Aufnehmen'}
        </Button>
      </Box>
    </Box>
  );
}; 