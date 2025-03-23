import { saveElectricityPrice, type ElectricityPrice } from './influxdb';

export async function updatePrice(): Promise<void> {
  try {
    const response = await fetch('https://api.example.com/electricity-prices');
    const data = await response.json();
    
    const priceData: ElectricityPrice = {
      basePrice: data.basePrice,
      workPrice: data.workPrice,
      provider: data.provider,
      validFrom: new Date()
    };

    await saveElectricityPrice(priceData);
    console.log('Strompreis erfolgreich aktualisiert');
  } catch (error) {
    console.error('Fehler bei der Preisaktualisierung:', error);
  }
}

export function startPriceUpdateJob() {
  // Aktualisiere den Preis alle 24 Stunden
  setInterval(updatePrice, 24 * 60 * 60 * 1000);
  
  // Führe die erste Aktualisierung sofort aus
  updatePrice();
} 