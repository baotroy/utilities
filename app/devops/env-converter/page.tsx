import { Metadata } from "next";
import EnvConverterComponent from "./components/env-converter";

export const metadata: Metadata = {
  title: ".env ↔ JSON / YAML Converter",
  description:
    "Convert .env files to JSON or YAML and flatten JSON / YAML config into .env variables, in the browser.",
};

const EnvConverter = () => {
  return <EnvConverterComponent />;
};

export default EnvConverter;
