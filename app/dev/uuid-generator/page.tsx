import { Metadata } from "next";
import UuidGeneratorComponent from "../components/uuid-generator";

export const metadata: Metadata = {
  title: "UUID Generator",
  description: "Generate universally unique identifiers (UUIDs). Supports v1 (time-based), v4 (random), and v5 (SHA-1 name-based).",
};

const UuidGenerator = () => {
  return <UuidGeneratorComponent />;
};

export default UuidGenerator;
