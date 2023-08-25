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

    if (detections.length !== 1) return false; // 早期返回，避免多余的嵌套
    const [detection] = detections;
    const faceArea = (detection.box.area / (detection.imageHeight * detection.imageWidth)) * 100;

    // 這部分的條件檢查已經是最優化的，進一步的改變可能會損害可讀性
    if (detection.box.width <= 256 || detection.box.height <= 256 || faceArea < 6.25) {
      console.log('人臉偵測失敗', detection.box.width, detection.box.height, faceArea);
      return false;
    }

    return true;
  };

  return { modelsLoaded, detectFace };
}
