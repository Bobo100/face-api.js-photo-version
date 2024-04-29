import _last from "lodash/last";
import _padStart from "lodash/padStart";
import _get from "lodash/get";
import _split from "lodash/split";
import _slice from "lodash/slice";

const validExtensions = [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".gif"];
const validMIMETypes = ["image/jpeg", "image/png", "image/tiff", "image/gif"];
const mimeToExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/tiff": ".tiff",
  "image/gif": ".gif",
};

const utils = {
  base64ToBlob: (base64) => {
    if (base64 instanceof Blob) {
      return base64;
    }

    const sliceSize = 512;
    let b64Data = base64.replace(/^[^,]+,/, "");
    b64Data = b64Data.replace(/\s/g, "");
    let byteCharacters = window.atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);

      let byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      let byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }
    const type = base64.match(/image\/[^;]+/);
    return new Blob(byteArrays, { type: type });
  },
};

export default utils;
export { validExtensions };
