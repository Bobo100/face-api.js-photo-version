import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function useDetectFace() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const detectFace = async (image) => {
    if (!modelsLoaded) return;
    let message = [];
    const detections = await faceapi.detectAllFaces(
      image,
      new faceapi.SsdMobilenetv1Options()
    ).withFaceLandmarks();

    if (detections.length === 0) {
      message.push('avatar.face.detect.error.face');
      return { message, boxPoints: null, eyePoints: null };
    }
    if (detections.length > 1) {
      message.push('avatar.face.detect.error.face.multiple');
      return { message, boxPoints: null, eyePoints: null };
    }
    const [detection] = detections;
    const boxPoints = {
      topLeft: { x: detection.detection.box.left, y: detection.detection.box.top },
      topRight: { x: detection.detection.box.right, y: detection.detection.box.top },
      bottomLeft: { x: detection.detection.box.left, y: detection.detection.box.bottom },
      bottomRight: { x: detection.detection.box.right, y: detection.detection.box.bottom },
    };
    const eyePoints = {
      left: detection.landmarks.getLeftEye(),
      right: detection.landmarks.getRightEye(),
    };
    const faceArea =
      (detection.detection.box.area / (detection.detection.imageHeight * detection.detection.imageWidth)) *
      100;
    if (detection.detection.box.width <= 256)
      message.push('avatar.face.detect.error.face.width');
    if (detection.detection.box.height <= 256)
      message.push('avatar.face.detect.error.face.height');
    if (faceArea < 6.25) message.push('avatar.face.detect.error.face.area');

    return { message, boxPoints, eyePoints };
  };


  return { modelsLoaded, detectFace };
}
