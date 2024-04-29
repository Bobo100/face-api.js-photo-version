import imageUtils from "./imageUtils";
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
  drawScaleCropImage: (image, cropInfo, scale = 1.0) => {
    const { cropLeft, cropRight, cropTop, cropBottom } = cropInfo;
    const canvas = document.createElement("canvas");
    const width = cropRight - cropLeft;
    const height = cropBottom - cropTop;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      cropLeft,
      cropTop,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const b64 = canvas.toDataURL("image/jpeg");
    return imageUtils.base64ToBlob(b64);
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
    const hUp = parseInt(imgHeight * upscaleFactor);
    const wUp = parseInt(imgWidth * upscaleFactor);

    const newSrcBbox = srcBbox.map((coord) => coord * upscaleFactor);

    const { avgEyePoints, eyeCenter, eyeDistance } =
      imageCropUtils.getEyePointsInfo(eyePoints, upscaleFactor);

    let targetEdgeW = parseInt(eyeDistance * edgeFactorW);
    let targetEdgeH = parseInt(eyeDistance * edgeFactorH);
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

    const cropWidth = smartCropBbox.cropRight - smartCropBbox.cropLeft;
    const cropHeight = smartCropBbox.cropBottom - smartCropBbox.cropTop;
    const cropLongerSide = Math.max(cropWidth, cropHeight);
    const scale = cropLongerSide > 1024 ? 1024 / cropLongerSide : 1;
    const blob = imageCropUtils.drawScaleCropImage(
      image,
      {
        cropLeft: cropWBegin,
        cropRight: cropWBegin + targetEdgeW,
        cropTop: cropHBegin,
        cropBottom: cropHBegin + targetEdgeH,
      },
      scale
    );
    // 下載blob
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "crop.jpg";
    a.click();
    URL.revokeObjectURL(a.href);
    return {
      scale,
      cropRect: {
        // cropLeft: smartCropBbox.cropLeft * scale,
        // cropRight: smartCropBbox.cropRight * scale,
        // cropTop: smartCropBbox.cropTop * scale,
        // cropBottom: smartCropBbox.cropBottom * scale,
        cropLeft: cropWBegin * scale,
        cropRight: (cropWBegin + targetEdgeW) * scale,
        cropTop: cropHBegin * scale,
        cropBottom: (cropHBegin + targetEdgeH) * scale,
      },
      smartCropBbox,
      smartCropBboxError,
      cropBlob: blob,
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
