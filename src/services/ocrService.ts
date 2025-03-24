import * as tf from '@tensorflow/tfjs';
import * as Tesseract from 'tesseract.js';
import { imagePreprocessingService } from './imagePreprocessingService';

interface OCRResult {
  text: string;
  confidence: number;
  meterType?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface MeterType {
  id: string;
  name: string;
  description: string;
  digitCount: number;
  decimalPlaces: number;
}

class OCRService {
  private static instance: OCRService;
  private meterDetectionModel: tf.LayersModel | null = null;
  private worker: Tesseract.Worker | null = null;
  private isModelLoading: boolean = false;
  private readonly meterTypes: MeterType[] = [
    {
      id: 'digital',
      name: 'Digitaler Zähler',
      description: 'Moderner digitaler Stromzähler',
      digitCount: 6,
      decimalPlaces: 1
    },
    {
      id: 'analog',
      name: 'Analoger Zähler',
      description: 'Klassischer Ferraris-Zähler',
      digitCount: 5,
      decimalPlaces: 2
    }
  ];

  private constructor() {
    this.initializeWorker();
  }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  private async initializeWorker(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('deu');
      await this.worker.loadLanguage('deu');
      await this.worker.initialize('deu');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789,.',
      });
    }
  }

  private async loadMeterDetectionModel(): Promise<void> {
    if (this.meterDetectionModel || this.isModelLoading) return;

    this.isModelLoading = true;
    try {
      const modelPath = process.env.OCR_MODEL_PATH || 'models/meter-detection/model.json';
      this.meterDetectionModel = await tf.loadLayersModel(modelPath);
    } catch (error) {
      console.error('Fehler beim Laden des Zählererkennungsmodells:', error);
      throw error;
    } finally {
      this.isModelLoading = false;
    }
  }

  public async detectMeterType(imageData: ImageData): Promise<MeterType> {
    await this.loadMeterDetectionModel();
    if (!this.meterDetectionModel) {
      throw new Error('Zählererkennungsmodell nicht geladen');
    }

    // Bildvorverarbeitung
    const processedImage = await imagePreprocessingService.preprocessImage(imageData, {
      resize: { width: 224, height: 224 },
      normalize: true
    });

    const tensor = tf.browser.fromPixels(processedImage)
      .expandDims(0)
      .toFloat();

    // Zählertyp erkennen
    const prediction = this.meterDetectionModel.predict(tensor) as tf.Tensor;
    const meterTypeIndex = await prediction.argMax(1).data();

    // Aufräumen
    tensor.dispose();
    prediction.dispose();

    return this.meterTypes[meterTypeIndex[0]] || this.meterTypes[0];
  }

  public async findMeterInImage(imageData: ImageData): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null> {
    // Kantenerkennung für bessere Zählererkennung
    const edgeImage = await imagePreprocessingService.detectEdges(imageData);
    
    // TODO: Implementierung der Zählererkennung basierend auf Kantenerkennung
    // Dies würde ein speziell trainiertes Modell für Objekterkennung erfordern

    return null;
  }

  public async recognizeReading(
    imageData: ImageData,
    meterType?: string
  ): Promise<OCRResult> {
    await this.initializeWorker();
    if (!this.worker) {
      throw new Error('OCR Worker nicht initialisiert');
    }

    try {
      // Zählertyp erkennen falls nicht angegeben
      const detectedMeterType = meterType ? 
        this.meterTypes.find(m => m.id === meterType) : 
        await this.detectMeterType(imageData);

      // Zählerposition im Bild finden
      const meterPosition = await this.findMeterInImage(imageData);
      
      // Bild vorverarbeiten
      const processedImage = await imagePreprocessingService.enhanceMeterDisplay(imageData);
      
      // OCR durchführen
      const result = await this.worker.recognize(processedImage);

      // Ergebnis verarbeiten und validieren
      const text = this.validateAndFormatReading(
        result.data.text,
        detectedMeterType || this.meterTypes[0]
      );
      const confidence = result.data.confidence;

      return {
        text,
        confidence,
        meterType: detectedMeterType?.id,
        boundingBox: meterPosition || undefined,
      };
    } catch (error) {
      console.error('Fehler bei der Texterkennung:', error);
      throw error;
    }
  }

  private validateAndFormatReading(text: string, meterType: MeterType): string {
    // Entferne alle nicht-numerischen Zeichen außer Komma und Punkt
    let cleaned = text.replace(/[^\d,\.]/g, '');
    
    // Konvertiere zu einem Array von Ziffern
    const digits = cleaned.replace(/[,\.]/g, '').split('');
    
    // Prüfe ob die Anzahl der Ziffern zur erwarteten Anzahl passt
    if (digits.length > meterType.digitCount) {
      digits.splice(meterType.digitCount);
    } else while (digits.length < meterType.digitCount) {
      digits.unshift('0');
    }
    
    // Füge Dezimalstellen hinzu
    if (meterType.decimalPlaces > 0) {
      digits.splice(-meterType.decimalPlaces, 0, ',');
    }
    
    return digits.join('');
  }

  public async trainModel(trainingData: Array<{
    image: ImageData;
    label: string;
  }>): Promise<void> {
    // TODO: Implementierung des Modelltrainings
    // Dies würde ein separates Trainingsmodul erfordern
  }

  public async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    if (this.meterDetectionModel) {
      this.meterDetectionModel.dispose();
      this.meterDetectionModel = null;
    }
  }
}

export const ocrService = OCRService.getInstance(); 