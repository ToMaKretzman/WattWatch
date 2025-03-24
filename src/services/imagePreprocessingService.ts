import * as tf from '@tensorflow/tfjs';

interface PreprocessingOptions {
  resize?: {
    width: number;
    height: number;
  };
  normalize?: boolean;
  threshold?: number;
  removeNoise?: boolean;
}

class ImagePreprocessingService {
  private static instance: ImagePreprocessingService;

  private constructor() {}

  public static getInstance(): ImagePreprocessingService {
    if (!ImagePreprocessingService.instance) {
      ImagePreprocessingService.instance = new ImagePreprocessingService();
    }
    return ImagePreprocessingService.instance;
  }

  public async preprocessImage(
    imageData: ImageData,
    options: PreprocessingOptions = {}
  ): Promise<ImageData> {
    let tensor = tf.browser.fromPixels(imageData);

    // Konvertiere zu Graustufen
    tensor = tf.mean(tensor, 2, true);

    // Größe anpassen falls gewünscht
    if (options.resize) {
      tensor = tf.image.resizeBilinear(tensor, [
        options.resize.height,
        options.resize.width,
      ]);
    }

    // Normalisierung (0-1)
    if (options.normalize) {
      tensor = tensor.div(255.0);
    }

    // Schwellenwert-Operation für besseren Kontrast
    if (options.threshold) {
      tensor = tensor.greater(options.threshold).toFloat();
    }

    // Rauschentfernung durch Medianfilter
    if (options.removeNoise) {
      tensor = this.applyMedianFilter(tensor);
    }

    // Konvertiere zurück zu ImageData
    const [height, width] = tensor.shape;
    const pixels = await tensor.mul(255).toInt().data();
    const uint8Array = new Uint8ClampedArray(pixels);
    
    // Aufräumen
    tensor.dispose();

    return new ImageData(uint8Array, width, height);
  }

  private applyMedianFilter(tensor: tf.Tensor3D): tf.Tensor3D {
    return tf.tidy(() => {
      const padded = tensor.pad([[1, 1], [1, 1], [0, 0]]);
      const patches = tf.image.extractPatches(
        padded,
        [3, 3, 1],
        [1, 1, 1],
        [1, 1, 1],
        'valid'
      );
      
      const [height, width, ] = tensor.shape;
      const sorted = patches.reshape([height, width, 9]).sort((a: number, b: number) => a - b);
      return sorted.slice([0, 0, 4], [height, width, 1]);
    });
  }

  public async enhanceMeterDisplay(imageData: ImageData): Promise<ImageData> {
    return this.preprocessImage(imageData, {
      resize: { width: 224, height: 224 },
      normalize: true,
      threshold: 0.5,
      removeNoise: true
    });
  }

  public async detectEdges(imageData: ImageData): Promise<ImageData> {
    const tensor = tf.browser.fromPixels(imageData);
    const grayscale = tf.mean(tensor, 2, true);
    
    // Sobel-Operator für Kantenerkennung
    const sobelX = tf.tensor2d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
    const sobelY = tf.tensor2d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]);
    
    const [height, width] = grayscale.shape;
    const edges = tf.tidy(() => {
      const padded = grayscale.pad([[1, 1], [1, 1], [0, 0]]);
      const patches = tf.image.extractPatches(
        padded,
        [3, 3, 1],
        [1, 1, 1],
        [1, 1, 1],
        'valid'
      );
      
      const patchesReshaped = patches.reshape([height, width, 9]);
      const gx = patchesReshaped.mul(sobelX.flatten()).sum(-1);
      const gy = patchesReshaped.mul(sobelY.flatten()).sum(-1);
      
      return gx.square().add(gy.square()).sqrt();
    });
    
    // Normalisiere und konvertiere zurück zu ImageData
    const normalized = edges.div(edges.max());
    const pixels = await normalized.mul(255).toInt().data();
    const uint8Array = new Uint8ClampedArray(pixels);
    
    // Aufräumen
    tensor.dispose();
    grayscale.dispose();
    sobelX.dispose();
    sobelY.dispose();
    edges.dispose();
    normalized.dispose();
    
    return new ImageData(uint8Array, width, height);
  }
}

export const imagePreprocessingService = ImagePreprocessingService.getInstance(); 