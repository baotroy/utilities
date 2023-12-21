import { PixelCrop } from "react-image-crop";
import { useEffect, DependencyList } from 'react'
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


export const canvasPreview = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) => {
  const TO_RADIANS = Math.PI / 180
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to
  // size the image back down if you want to download/upload and be
  // true to the images natural size.
  const pixelRatio = window.devicePixelRatio
  // const pixelRatio = 1

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY

  const rotateRads = rotate * TO_RADIANS
  const centerX = image.naturalWidth / 2
  const centerY = image.naturalHeight / 2

  ctx.save()

  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY)
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY)
  // 3) Rotate around the origin
  ctx.rotate(rotateRads)
  // 2) Scale the image
  ctx.scale(scale, scale)
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY)
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  )

  ctx.restore()
}


export const useDebounceEffect = (
  fn: () => void,
  waitTime: number,
  deps?: DependencyList
) => {
  useEffect(() => {
    const t = setTimeout(() => {
      fn.apply(undefined, deps)
    }, waitTime)

    return () => {
      clearTimeout(t)
    }
  }, deps)
}
