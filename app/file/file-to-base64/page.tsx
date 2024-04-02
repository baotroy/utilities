import { Metadata } from "next";
import File2Base64Component from "../components/file-to-base64";

export const metadata: Metadata = {
  title: "File To Base64",
  description:
    "Encode file to Base64 online and embed it into any text document such as HTML, JSON, or XML",
  // other metadata
};

const ImageToBase64 = () => {
  return <File2Base64Component />;
};

export default ImageToBase64;
