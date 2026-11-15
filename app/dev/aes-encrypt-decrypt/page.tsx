import { Metadata } from "next";
import AesEncryptDecryptComponent from "./components/aes-encrypt-decrypt";

export const metadata: Metadata = {
  title: "AES Encrypt/Decrypt",
  description:
    "Encrypt and decrypt text with AES-GCM, AES-CBC or AES-CTR using a password (PBKDF2) or a raw 128/192/256-bit key. Runs entirely in your browser.",
};

const AesEncryptDecrypt = () => {
  return <AesEncryptDecryptComponent />;
};

export default AesEncryptDecrypt;
