import type { Metadata } from "next";
import Base64EncoderComponent from "../components/base64-encoder";

export const metadata: Metadata = {
  title: "Base64 Encode/Decode | Encode and Decode Base64 Text",
  description:
    "Encode text to Base64 or decode Base64 back to text. Supports UTF-8 encoding and URL-safe Base64 format.",
  keywords: [
    "base64 encoder",
    "base64 decoder",
    "base64 encode",
    "base64 decode",
    "url-safe base64",
    "text to base64",
  ],
};

export default function Base64EncoderPage() {
  return <Base64EncoderComponent />;
}
