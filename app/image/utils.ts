import { Dimensions, FileFormat, Unit } from "./type";

export const getImageDimensions = (base64: string) : Promise<Dimensions> =>  {
  // Create a new image element
  const img = new Image();
  // Set the source of the image to the base64 string
  img.src = base64;
  // Return a promise that resolves with the width and height of the image
  return new Promise((resolve, reject) => {
    // When the image is loaded, get the natural width and height
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      // Resolve the promise with an object containing the dimensions
      resolve({ width, height });
    };
    // If the image fails to load, reject the promise with an error
    img.onerror = () => {
      reject(new Error("Invalid base64 string"));
    };
  });
}

export const resizeImageExec = (file: string, newWidth: number, newHeight: number, outFormat: FileFormat) : Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a new image element
    const img = new Image();
    // Set the source of the image to the base64 string
    img.src = file;
    // When the image is loaded, get the natural width and height
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = newWidth;
      canvas.height = newHeight;
      if (ctx !== null) {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        return resolve(canvas.toDataURL(outFormat));
      }
      reject(new Error("Invalid base64 string"));
    };
    // If the image fails to load, reject the promise with an error
    img.onerror = () => {
      reject(new Error("Invalid base64 string"));
    };
  });
}

export const convertOtherUnitToPixel = (value: number, unit: Unit, dpi: number) : number => {
  switch(unit) {
    case "in":
      return Math.round(value * dpi);
    case "cm":
      return Math.round(value * dpi / 2.54);
    case "mm":
      return Math.round(value * dpi / 25.4);
    default:
      return value;
  }
}

export const convertPixelOtherUnit = (value: number, unit: Unit, dpi: number) => {
  switch(unit) {
    case "in":
      return value / dpi;
    case "cm":
      return value / dpi * 2.54;
    case "mm":
      return value / dpi * 25.4;
    default:
      return value;
  }
}
