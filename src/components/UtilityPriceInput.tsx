import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { UtilityType, UtilityPrice, saveUtilityPrice, getLatestUtilityPrice } from '../services/influxdb';

const UTILITY_TYPES: Record<UtilityType, { label: string; unit: string }> = {
  electricity: { label: 'Strom', unit: 'kWh' },
  gas: { label: 'Gas', unit: 'm³' },
  water: { label: 'Wasser', unit: 'm³' },
};

export default function UtilityPriceInput() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<UtilityPrice | null>(null);
  const [formData, setFormData] = useState<UtilityPrice>({
    basePrice: 0,
    workPrice: 0,
    provider: '',
    type: 'electricity',
    validFrom: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadLatestPrice(formData.type);
  }, [formData.type]);

  const loadLatestPrice = async (type: UtilityType) => {
    try {
      setLoading(true);
      setError(null);
      const price = await getLatestUtilityPrice(type);
      setCurrentPrice(price);
    } catch (error) {
      setError('Fehler beim Laden des aktuellen Preises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await saveUtilityPrice(formData);
      setSuccess('Preis erfolgreich gespeichert');
      loadLatestPrice(formData.type);
    } catch (error) {
      setError('Fehler beim Speichern des Preises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'workPrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleTypeChange = (e: SelectChangeEvent<UtilityType>) => {
    setFormData(prev => ({
      ...prev,
      type: e.target.value as UtilityType,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="type-label">Versorgungsart</InputLabel>
        <Select
          labelId="type-label"
          id="type"
          value={formData.type}
          label="Versorgungsart"
          onChange={handleTypeChange}
        >
          {Object.entries(UTILITY_TYPES).map(([value, { label }]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {currentPrice && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aktueller Preis für {UTILITY_TYPES[currentPrice.type].label}:<br />
          Grundpreis: {currentPrice.basePrice.toFixed(2)} €/Monat<br />
          Arbeitspreis: {currentPrice.workPrice.toFixed(2)} Cent/{UTILITY_TYPES[currentPrice.type].unit}<br />
          Anbieter: {currentPrice.provider}<br />
          Gültig ab: {new Date(currentPrice.validFrom).toLocaleDateString()}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Grundpreis (€/Monat)"
        type="number"
        name="basePrice"
        value={formData.basePrice}
        onChange={handleTextFieldChange}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={`Arbeitspreis (Cent/${UTILITY_TYPES[formData.type].unit})`}
        type="number"
        name="workPrice"
        value={formData.workPrice}
        onChange={handleTextFieldChange}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Anbieter"
        name="provider"
        value={formData.provider}
        onChange={handleTextFieldChange}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Gültig ab"
        type="date"
        name="validFrom"
        value={formData.validFrom}
        onChange={handleTextFieldChange}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Speichert...' : 'Speichern'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
} 