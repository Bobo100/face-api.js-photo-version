import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function useDetectFace() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const detectFace = async (image) => {    
    if (!modelsLoaded) return;
    const detections = await faceapi.detectAllFaces(
      image,
      new faceapi.SsdMobilenetv1Options()
    );

    const faceCount = detections.length;
    if (faceCount === 0) return false;
    if (faceCount === 1) {
      const faceArea =
        faceCount > 0
          ? (detections[0].box.area /
            (detections[0].imageHeight * detections[0].imageWidth)) *
          100
          : 0;
      if (
        detections[0].imageWidth < 640 ||
        detections[0].imageHeight < 480 ||
        faceArea < 10
      )
        return false;
      return true;
    }
    return false;
  };

  return { modelsLoaded, detectFace };
}
