import * as tf from '@tensorflow/tfjs';

interface TrainingLogs {
  loss: number;
  acc: number;
}

export async function createMeterDetectionModel(): Promise<tf.LayersModel> {
  const model = tf.sequential();

  // Eingabeschicht
  model.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Erste Faltungsschicht
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Zweite Faltungsschicht
  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Dritte Faltungsschicht
  model.add(tf.layers.conv2d({
    filters: 256,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Flatten und Dense Schichten
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 512, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' })); // 2 Klassen: digital und analog

  // Kompiliere das Modell
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  trainingData: Array<{
    image: ImageData;
    label: number; // 0 für digital, 1 für analog
  }>,
  epochs: number = 50,
  batchSize: number = 32
): Promise<tf.History> {
  // Konvertiere die Trainingsdaten in Tensoren
  const xs = tf.stack(
    trainingData.map(d => 
      tf.browser.fromPixels(d.image)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
    )
  );

  const ys = tf.oneHot(
    tf.tensor1d(trainingData.map(d => d.label), 'int32'),
    2
  );

  // Training durchführen
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch: number, logs: TrainingLogs | undefined) => {
        if (logs) {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    }
  });

  // Aufräumen
  xs.dispose();
  ys.dispose();

  return history;
}

export async function saveModel(model: tf.LayersModel, path: string): Promise<void> {
  await model.save(`file://${path}`);
}

export async function loadModel(path: string): Promise<tf.LayersModel> {
  return await tf.loadLayersModel(`file://${path}`);
} 