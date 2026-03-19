import { Metadata } from "next";
import JsonPrettierComponent from "../components/json-prettier";

export const metadata: Metadata = {
  title: "JSON Prettier",
  description:
    "Online JSON Formatter / Beautifier and JSON Validator will format JSON data, and helps to validate",
};

// Force dynamic rendering due to react-ace dependency
export const dynamic = "force-dynamic";

const JsonPrettier = () => {
  return <JsonPrettierComponent />;
};

export default JsonPrettier;
