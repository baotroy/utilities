import { Metadata } from "next";
import YamlJsonConverterComponent from "./components/yaml-json-converter";

export const metadata: Metadata = {
  title: "YAML / TOML / JSON Converter",
  description: "Convert between YAML, TOML and JSON in the browser, with error positions.",
};

const YamlJsonConverter = () => <YamlJsonConverterComponent />;

export default YamlJsonConverter;
