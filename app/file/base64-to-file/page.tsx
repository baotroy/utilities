import { Metadata } from "next";
import Base64ToFileComponent from "./components/base64-to-file";

export const metadata: Metadata = {
  title: "Base64 to File",
  description: "Turn a Base64 string or data URI back into a file: detect its type, preview it and download it.",
};

const Base64ToFile = () => <Base64ToFileComponent />;

export default Base64ToFile;
