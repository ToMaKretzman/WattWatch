import { Point, InfluxDB } from '@influxdata/influxdb-client';
import type { OCRResult } from './openai';
import { bucket, org } from './influxdbClient';

// In Docker wird die URL relativ zum nginx-Proxy sein
const url = '/influxdb';
const token = import.meta.env.VITE_INFLUXDB_TOKEN;

const client = new InfluxDB({
  url,
  token
});

const writeApi = client.getWriteApi(org, bucket);
const queryApi = client.getQueryApi(org);

// Hilfsfunktion zum Konvertieren deutscher Zahlen
function parseGermanNumber(value: string): number {
  // Entferne alle Punkte (Tausendertrennzeichen)
  const withoutDots = value.replace(/\./g, '');
  // Ersetze Komma durch Punkt für parseFloat
  const withDecimalPoint = withoutDots.replace(',', '.');
  return parseFloat(withDecimalPoint);
}

export type UtilityType = 'electricity' | 'gas' | 'water';

export interface UtilityPrice {
  basePrice: number;
  workPrice: number;
  provider: string;
  type: UtilityType;
  validFrom: string;
}

interface QueryResult {
  base_price: number;
  work_price: number;
  provider: string;
  _time: string;
}

export async function saveUtilityPrice(price: UtilityPrice): Promise<void> {
  try {
    const point = new Point('utility_price')
      .tag('type', price.type)
      .floatField('base_price', price.basePrice)
      .floatField('work_price', price.workPrice)
      .stringField('provider', price.provider)
      .timestamp(new Date(price.validFrom));

    await writeApi.writePoint(point);
    await writeApi.close();
  } catch (error) {
    console.error('Fehler beim Speichern des Preises:', error);
    throw error;
  }
}

export async function getLatestUtilityPrice(type: UtilityType): Promise<UtilityPrice | null> {
  try {
    const query = `from(bucket: "${bucket}")
      |> range(start: -1y)
      |> filter(fn: (r) => r._measurement == "utility_price")
      |> filter(fn: (r) => r.type == "${type}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> last()`;

    const result = await queryApi.collectRows<QueryResult>(query);
    
    if (result.length === 0) {
      return null;
    }

    const latestPrice = result[0];
    return {
      basePrice: latestPrice.base_price,
      workPrice: latestPrice.work_price,
      provider: latestPrice.provider,
      type: type,
      validFrom: latestPrice._time
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des letzten Preises:', error);
    throw error;
  }
}

export interface ElectricityPrice {
  basePrice: number;  // Grundpreis in Euro pro Monat
  workPrice: number;  // Arbeitspreis in Cent pro kWh
  provider: string;   // Stromanbieter
  validFrom: Date;    // Gültig ab
}

export async function saveElectricityPrice(price: ElectricityPrice): Promise<void> {
  try {
    const point = new Point('electricity_price')
      .floatField('base_price', price.basePrice)
      .floatField('work_price', price.workPrice)
      .stringField('provider', price.provider)
      .timestamp(price.validFrom);

    await writeApi.writePoint(point);
    await writeApi.flush();
    console.log('Strompreis erfolgreich gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern des Strompreises:', error);
    throw error;
  }
}

export async function getLatestElectricityPrice(): Promise<ElectricityPrice | null> {
  const queryApi = client.getQueryApi(org);
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -365d)
      |> filter(fn: (r) => r["_measurement"] == "electricity_price")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const result = await queryApi.collectRows<any>(query);
    if (result.length > 0) {
      return {
        basePrice: result[0].base_price,
        workPrice: result[0].work_price,
        provider: result[0].provider,
        validFrom: new Date(result[0]._time)
      };
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Abrufen des aktuellen Strompreises:', error);
    throw error;
  }
}

export async function saveReading(result: OCRResult): Promise<void> {
  try {
    console.log('Versuche Daten in InfluxDB zu speichern:', {
      url,
      token: token ? 'Vorhanden' : 'Fehlt',
      org,
      bucket
    });

    // Konvertiere den String-Wert in eine Zahl mit Nachkommastellen
    const readingValue = parseGermanNumber(result.current_reading.value);
    console.log('Originaler Wert:', result.current_reading.value);
    console.log('Konvertierter Wert:', readingValue);

    const point = new Point('meter_reading')
      .stringField('meter_number', result.meter_number.value)
      .floatField('value', readingValue)
      .stringField('unit', result.unit.value)
      .floatField('confidence', result.current_reading.confidence)
      .timestamp(new Date());

    // Optional: Tarifinfos
    if (result.tariff_info?.HT?.value !== 'unknown') {
      point.floatField('HT', parseGermanNumber(result.tariff_info.HT.value));
    }
    if (result.tariff_info?.NT?.value !== 'unknown') {
      point.floatField('NT', parseGermanNumber(result.tariff_info.NT.value));
    }

    // Optional: Zusatzinfos
    if (result.additional_info?.value !== 'unknown') {
      point.stringField('additional_info', result.additional_info.value);
    }

    console.log('Sende Datenpunkt:', point);
    await writeApi.writePoint(point);
    await writeApi.flush();
    console.log('Daten erfolgreich gespeichert');
  } catch (error) {
    console.error('Fehler beim Schreiben in InfluxDB:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
      console.error('Stack:', error.stack);
    }
    throw new Error(`Fehler beim Schreiben in InfluxDB: ${error instanceof Error ? error.message : error}`);
  }
}

interface ReadingResult {
  value: number;
  meter_number: string;
  unit: string;
  confidence: number;
  time: string;
  _time: string;
}

export async function getLatestReading(): Promise<ReadingResult | null> {
  const queryApi = client.getQueryApi(org);
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -365d)
      |> filter(fn: (r) => r["_measurement"] == "meter_reading")
      |> filter(fn: (r) => r["_field"] == "value" or r["_field"] == "meter_number" or r["_field"] == "unit" or r["_field"] == "confidence")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const result = await queryApi.collectRows<ReadingResult>(query);
    console.log('Letzte Messung:', result);
    if (result.length > 0) {
      // Stelle sicher, dass der Wert als Gleitkommazahl behandelt wird
      const value = typeof result[0].value === 'string' 
        ? parseFloat(result[0].value) 
        : result[0].value;

      return {
        value: value,
        meter_number: result[0].meter_number,
        unit: result[0].unit,
        confidence: result[0].confidence,
        time: result[0]._time,
        _time: result[0]._time
      };
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Abrufen des letzten Zählerstands:', error);
    throw error; // Fehler weiterwerfen statt null zurückzugeben
  }
} 