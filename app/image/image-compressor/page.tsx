import { Metadata } from "next";
import ImageCompressorComponent from "./components/image-compressor";

export const metadata: Metadata = {
  title: "Image Compressor & Converter",
  description: "Compress images and convert between JPEG, PNG, WebP and AVIF in the browser, with quality and size limits. Nothing is uploaded.",
};

const ImageCompressor = () => <ImageCompressorComponent />;

export default ImageCompressor;
