import * as tf from '@tensorflow/tfjs';
import * as Tesseract from 'tesseract.js';

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

class OCRService {
  private static instance: OCRService;
  private meterDetectionModel: tf.LayersModel | null = null;
  private worker: Tesseract.Worker | null = null;
  private isModelLoading: boolean = false;

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
      // TODO: Modell aus lokalem Speicher oder Server laden
      this.meterDetectionModel = await tf.loadLayersModel('path/to/model.json');
    } catch (error) {
      console.error('Fehler beim Laden des Zählererkennungsmodells:', error);
      throw error;
    } finally {
      this.isModelLoading = false;
    }
  }

  public async detectMeterType(imageData: ImageData): Promise<string> {
    await this.loadMeterDetectionModel();
    if (!this.meterDetectionModel) {
      throw new Error('Zählererkennungsmodell nicht geladen');
    }

    // Bildvorverarbeitung
    const tensor = tf.browser.fromPixels(imageData)
      .resizeBilinear([224, 224])
      .expandDims(0)
      .toFloat()
      .div(255.0);

    // Zählertyp erkennen
    const prediction = this.meterDetectionModel.predict(tensor) as tf.Tensor;
    const meterType = await prediction.argMax(1).data();

    // Aufräumen
    tensor.dispose();
    prediction.dispose();

    // TODO: Mapping von Zahlen zu Zählertypen implementieren
    return `Zählertyp ${meterType[0]}`;
  }

  public async findMeterInImage(imageData: ImageData): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null> {
    await this.loadMeterDetectionModel();
    if (!this.meterDetectionModel) {
      throw new Error('Zählererkennungsmodell nicht geladen');
    }

    // TODO: Implementierung der Zählererkennung im Bild
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
      // Zählerposition im Bild finden (optional)
      const meterPosition = await this.findMeterInImage(imageData);
      
      // OCR durchführen
      const result = await this.worker.recognize(imageData);

      // Ergebnis verarbeiten und validieren
      const text = result.data.text.replace(/[^\d,\.]/g, '');
      const confidence = result.data.confidence;

      return {
        text,
        confidence,
        meterType,
        boundingBox: meterPosition || undefined,
      };
    } catch (error) {
      console.error('Fehler bei der Texterkennung:', error);
      throw error;
    }
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