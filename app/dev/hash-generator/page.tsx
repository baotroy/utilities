import { Metadata } from "next";
import HashGeneratorComponent from "../components/hash-generator";

export const metadata: Metadata = {
  title: "Hash Generator",
  description: "Generate cryptographic hash values using MD5, SHA-1, SHA-256, and SHA-512 algorithms.",
};

const HashGenerator = () => {
  return <HashGeneratorComponent />;
};

export default HashGenerator;
