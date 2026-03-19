import { Metadata } from "next";
import QRCodeReaderComponent from "./components/qr-reader";

export const metadata: Metadata = {
  title: "QR Code Reader",
  description:
    "Read QR codes from images or camera. Upload an image with a QR code or scan QR codes in real-time using your device camera. Instantly decode and display QR code content.",
};

export default function QRCodeReaderPage() {
  return <QRCodeReaderComponent />;
}
