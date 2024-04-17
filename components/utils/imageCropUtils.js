import _get from "lodash/get";
import _sumBy from "lodash/sumBy";
import _size from "lodash/size";

const imageCropUtils = {
  getAnnotationPoints: (faceData, annotationName) => {
    if (!faceData || !annotationName) return;
    if (!faceData.annotations) return;
    if (!faceData.annotations[annotationName]) return;
    const points = faceData.annotations[annotationName].map((point) => {
      return { x: point[0], y: point[1] };
    });
    return points;
  },

  getEyePointsInfo: (eyePoints, upscaleFactor) => {
    const { left, right } = eyePoints || {};
    const avgEyePoints = {
      left: {
        x: (upscaleFactor * _sumBy(left, (point) => point.x)) / _size(left),
        y: (upscaleFactor * _sumBy(left, (point) => point.y)) / _size(left),
      },
      right: {
        x: (upscaleFactor * _sumBy(right, (point) => point.x)) / _size(right),
        y: (upscaleFactor * _sumBy(right, (point) => point.y)) / _size(right),
      },
    };
    const eyeCenter = {
      x: parseInt(
        (_get(avgEyePoints, "left.x", 0) + _get(avgEyePoints, "right.x", 0)) / 2
      ),
      y: parseInt(
        (_get(avgEyePoints, "left.y", 0) + _get(avgEyePoints, "right.y", 0)) / 2
      ),
    };
    const eyeDistance =
      ((_get(avgEyePoints, "left.x", 0) - _get(avgEyePoints, "right.x", 0)) **
        2 +
        (_get(avgEyePoints, "left.y", 0) - _get(avgEyePoints, "right.y", 0)) **
          2) **
      0.5;
    return { avgEyePoints, eyeCenter, eyeDistance };
  },
  cropFaceForMakeup: (
    image,
    eyePoints,
    srcBbox,
    upscaleFactor = 1,
    edgeFactorW = 3.5,
    edgeFactorH = 3.5
  ) => {
    let smartCropBboxError = false;
    const { width: imgWidth, height: imgHeight } = image;
    const wUp = parseInt(imgWidth * upscaleFactor);
    const hUp = parseInt(imgHeight * upscaleFactor);

    const newSrcBbox = srcBbox.map((coord) => coord * upscaleFactor);

    const { avgEyePoints, eyeCenter, eyeDistance } =
      imageCropUtils.getEyePointsInfo(eyePoints, upscaleFactor);
    console.log(
      "avgEyePoints",
      avgEyePoints,
      "eyeCenter",
      eyeCenter,
      "eyeDistance",
      eyeDistance
    );

    const cropWidth = parseInt(eyeDistance * edgeFactorW);
    const cropHeight = parseInt(eyeDistance * edgeFactorH);

    let targetEdgeW = cropWidth;
    let targetEdgeH = cropHeight;
    targetEdgeW = targetEdgeW < wUp ? targetEdgeW : wUp;
    targetEdgeH = targetEdgeH < hUp ? targetEdgeH : hUp;

    let cropWBegin = eyeCenter.x - targetEdgeW / 2;
    let cropWEnd = eyeCenter.x + targetEdgeW / 2;
    if (cropWBegin < 0 && cropWEnd > wUp) {
      smartCropBboxError = true;
    }
    cropWBegin = cropWBegin < 0 ? 0 : cropWBegin;
    cropWBegin =
      cropWEnd > wUp
        ? parseInt(cropWBegin - (cropWEnd - wUp))
        : parseInt(cropWBegin);

    let cropHBegin = eyeCenter.y - targetEdgeH * 0.4;
    let cropHEnd = eyeCenter.y + (targetEdgeH - targetEdgeH * 0.4);
    if (cropHBegin < 0 && cropHEnd > hUp) {
      smartCropBboxError = true;
    }
    cropHBegin = cropHBegin < 0 ? 0 : cropHBegin;
    cropHBegin =
      cropHEnd > hUp
        ? parseInt(cropHBegin - (cropHEnd - hUp))
        : parseInt(cropHBegin);
    const smartCropBbox = {
      cropLeft: newSrcBbox[0] - cropWBegin,
      cropTop: newSrcBbox[1] - cropHBegin,
      cropRight: newSrcBbox[2] - cropWBegin,
      cropBottom: newSrcBbox[3] - cropHBegin,
    };

    console.log("smartCropBbox", smartCropBbox);

    const cropLeft = Math.max(eyeCenter.x - cropWidth / 2, 0);
    const cropRight = Math.min(eyeCenter.x + cropWidth / 2, imgWidth);
    const cropTop = Math.max(eyeCenter.y - cropHeight * 0.4, 0);
    const cropBottom = Math.min(
      eyeCenter.y + (cropHeight - cropHeight * 0.4),
      imgHeight
    );
    const cropLongerSide = Math.max(cropWidth, cropHeight);
    const scale = cropLongerSide > 1024 ? 1024 / cropLongerSide : 1;
    return {
      scale,
      cropRect: {
        cropLeft: cropLeft * scale,
        cropRight: cropRight * scale,
        cropTop: cropTop * scale,
        cropBottom: cropBottom * scale,
      },
      smartCropBbox,
      smartCropBboxError,
      originalImage: {
        width: imgWidth,
        height: imgHeight,
      },
      avgEyePoints,
      eyeCenter,
    };
  },
};

export default imageCropUtils;
