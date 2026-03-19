import { Metadata } from "next";
import QRCodeReaderComponent from "./components/qr-reader";

export const metadata: Metadata = {
  title: "QR Code Reader & Generator",
  description:
    "Read and generate QR codes. Upload an image or scan with your camera to read QR codes. Generate QR codes from text or URLs and download them as images.",
};

export default function QRCodeReaderPage() {
  return <QRCodeReaderComponent />;
}
