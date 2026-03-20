import { Metadata } from "next";
import JsonToCsvComponent from "../components/json-to-csv";

export const metadata: Metadata = {
  title: "JSON to CSV",
  description: "Convert JSON array data to CSV (Comma-Separated Values) format.",
};

const JsonToCsv = () => {
  return <JsonToCsvComponent />;
};

export default JsonToCsv;
