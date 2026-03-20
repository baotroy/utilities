import { Metadata } from "next";
import CsvToJsonComponent from "../components/csv-to-json";

export const metadata: Metadata = {
  title: "CSV to JSON",
  description: "Convert CSV (Comma-Separated Values) data to JSON format.",
};

const CsvToJson = () => {
  return <CsvToJsonComponent />;
};

export default CsvToJson;
