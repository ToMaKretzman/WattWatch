import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Nur für Entwicklung, in Produktion sollte dies über ein Backend laufen
});

export interface OCRValue<T> {
  value: T;
  confidence: number;
}

export interface TariffInfo {
  HT: OCRValue<string>;
  NT: OCRValue<string>;
}

export interface OCRResult {
  meter_number: OCRValue<string>;
  current_reading: OCRValue<string>;
  unit: OCRValue<string>;
  tariff_info: TariffInfo;
  additional_info: OCRValue<string>;
}

const SYSTEM_PROMPT = "Du bist ein OCR-Experte für Strom-, Wasser- und Gaszähler.";
const USER_PROMPT = `
Du bist ein OCR-Experte und spezialisiert auf die präzise Erkennung von Zählerständen. 
Deine Aufgabe ist es, eindeutige und strukturierte Informationen aus einem Bild eines Zählers zu extrahieren. 
Die Daten sollen im JSON-Format ausgegeben werden.

Extrahiere die folgenden Informationen so präzise wie möglich:

1. Zählernummer: Identifikationsnummer des Zählers (z.B. 1 234 567)
2. Aktueller Zählerstand: Eine 6-stellige Zahl mit 1 Nachkommastelle (Beispiel: 123456,7)
3. Einheit des Zählerstands: kWh, m³ oder andere Einheiten (falls ersichtlich)
4. Zusätzliche Informationen: Hinweise, Seriennummern, Ablesedatum, falls erkennbar

Für jede extrahierte Information gib auch eine Konfidenz (confidence) zwischen 0 und 1 an.

Wenn eine Information nicht erkennbar ist, gib "unknown" als Wert an und setze die Konfidenz auf 0.

Antworte ausschließlich im folgenden JSON-Format:
{
    "meter_number": {
        "value": "123456789",
        "confidence": 0.98
    },
    "current_reading": {
        "value": "543210,7",
        "confidence": 0.95
    },
    "unit": {
        "value": "kWh",
        "confidence": 0.92
    },
    "additional_info": {
        "value": "Seriennummer: XYZ12345, Ablesedatum: 01.03.2025",
        "confidence": 0.85
    }
}`;

export async function performOCR(imageBase64: string): Promise<OCRResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von OpenAI erhalten');
    }

    // Extrahiere JSON aus der Antwort
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Kein JSON in der Antwort gefunden');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validiere das Ergebnis und setze Standardwerte für fehlende Felder
    return {
      meter_number: result.meter_number || { value: "unknown", confidence: 0 },
      current_reading: result.current_reading || { value: "0,0", confidence: 0 },
      unit: result.unit || { value: "kWh", confidence: 0 },
      tariff_info: {
        HT: result.tariff_info?.HT || { value: "unknown", confidence: 0 },
        NT: result.tariff_info?.NT || { value: "unknown", confidence: 0 }
      },
      additional_info: result.additional_info || { value: "unknown", confidence: 0 }
    };
  } catch (error) {
    console.error('Fehler bei der OCR-Erkennung:', error);
    throw error;
  }
} 