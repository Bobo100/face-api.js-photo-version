import { useEffect, useState, useRef } from 'react';
import type { Human, Config } from '@vladmandic/human';
import imageCropUtils from '../utils/imageCropUtils';

const humanConfig: Partial<Config> = {
  debug: true,
  filter: { enabled: false, equalization: false, flip: false },
  face: {
    enabled: true,
    detector: {
      rotation: false,
      maxDetected: 2,
      minConfidence: 0.5,
      return: true,
    },
    iris: { enabled: false },
    description: { enabled: false },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
  async: true,
  cacheModels: true,
  softwareKernels: true,
};

type Point = [number, number];

export default function useDetectFace() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [human, setHuman] = useState<Human | null>(null);

  useEffect(() => {
    importHuman();
    async function importHuman() {
      await import('@vladmandic/human').then(async (Human) => {
        const instance = new Human.default(humanConfig);
        await instance.load().then(() => {
          instance.warmup().then(() => {
            setHuman(instance);
            setModelsLoaded(true);
          });
        });
      });
    }
  }, []);

  const boundingBox = (points: number[][]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let [x, y] of points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    return { minX, minY, maxX, maxY };
  };

  const radianToDegree = (radian: number) => {
    return (radian * 180) / Math.PI;
  };

  const detectFace = async (image: HTMLImageElement) => {
    if (!modelsLoaded) return;
    const message: string[] = [];
    let orientation = { roll: 0, pitch: 0, yaw: 0 };

    const detections = await human!.detect(image);
    console.log(detections);
    const { face } = detections;
    if (face.length === 0) {
      message.push('請勿遮蔽臉部')
      return { message, boxPoints: null, eyePoints: null, orientation };
    }

    // face的長度不能大於1 就代表多張臉
    if (face.length > 1) {
      //   message.push(t('avatar.face.detect.error.face.multilple'));
      message.push('請勿多人同時拍攝')
      return { message, boxPoints: null, eyePoints: null, orientation };
    }


    const faceData = face[0];
    console.log(face);

    const faceMesh = faceData.mesh.map((item) => {
      return [item[0], item[1]] as Point;
    });

    const boundingBox = (points: Point[]) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let [x, y] of points) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }

      return { minX, minY, maxX, maxY };
    };

    const { minX, minY, maxX, maxY } = boundingBox(faceMesh);
    const boxPoints = {
      topLeft: {
        x: minX,
        y: minY,
      },
      topRight: {
        x: maxX,
        y: minY,
      },
      bottomLeft: {
        x: minX,
        y: maxY,
      },
      bottomRight: {
        x: maxX,
        y: maxY,
      },
    };

    // faceData.annotations.leftEyeUpper0
    // faceData.annotations.leftEyeLower0
    const leftEyeUpper = faceData.annotations.leftEyeUpper0.map((item) => {
      return { x: item[0], y: item[1] };
    });
    const leftEyeLower = faceData.annotations.leftEyeLower0.map((item) => {
      return { x: item[0], y: item[1] };
    });
    const rightEyeUpper = faceData.annotations.rightEyeUpper0.map((item) => {
      return { x: item[0], y: item[1] };
    });
    const rightEyeLower = faceData.annotations.rightEyeLower0.map((item) => {
      return { x: item[0], y: item[1] };
    });

    const eyePoints = {
      left: [...leftEyeUpper, ...leftEyeLower],
      right: [...rightEyeUpper, ...rightEyeLower],
    };

    const faceArea =
      (faceData.box[2] * faceData.box[3])
    // For v1.5: show same error message for sizing
    console.log("faceArea", faceArea);
    if (faceArea < 128) {
      message.push(
        // t("avatar.face.detect.error.face.area")
        '臉部太小'
      );
    }

    const radianToDegree = (radian: number) => {
      return radian * 180 / Math.PI;
    }

    console.log('pitche', radianToDegree(faceData.rotation?.angle.pitch as number))
    console.log('yaw', radianToDegree(faceData.rotation?.angle.yaw as number))
    console.log('roll', radianToDegree(faceData.rotation?.angle.roll as number))
    orientation = {
      roll: radianToDegree(faceData.rotation?.angle.roll as number),
      pitch: radianToDegree(faceData.rotation?.angle.pitch as number),
      yaw: radianToDegree(faceData.rotation?.angle.yaw as number),
    }

    return {
      message, boxPoints, eyePoints, orientation, annotations: faceData.annotations
    };
  };


  const detectFace4HairStyle = async (image: HTMLImageElement) => {
    if (!modelsLoaded) return;
    let message: string[] = [];
    if (!human) return { message, scale: null, imageBlob: null };
    const detections = await human.detect(image);
    const { face } = detections;
    if (face.length === 0 || face.length > 1) {
      //TODO: multi face error message
      message.push('avatar.face.detect.error.face.multilple');
      return { message, scale: null, imageBlob: null };
    }

    const faceData = face[0];

    // cropBox
    const faceMesh = faceData.mesh.map((item) => {
      return [item[0], item[1]];
    });
    const { minX, minY, maxX, maxY } = boundingBox(faceMesh);
    const faceRect = {
      top: minY,
      bottom: maxY,
      left: minX,
      right: maxX,
    };
    const { scale, blob } = imageCropUtils.cropFaceForHairStyle(
      image,
      faceRect
    );

    const faceArea = faceData.box[2] * faceData.box[3];
    if (faceArea < 128) {
      message.push('avatar.face.detect.error.face.area');
      return { message, scale: null, imageBlob: null };
    }

    const angle = faceData.rotation;
    const yawDegree = Math.abs(radianToDegree(angle?.angle.yaw as number));
    if (yawDegree > 60) {
      // TODO: update the error message
      message.push(('avatar.face.detect.error.face.yaw'));
      return { message, scale: null, imageBlob: null };
    }

    // TODO: if crop image should change scale and imageBlob value
    return { message, scale: scale, imageBlob: blob };
  };



  return { modelsLoaded, detectFace, detectFace4HairStyle, human };
}
