import { Metadata } from "next";
import ConvertCaseComponent from "../components/convert-case";

export const metadata: Metadata = {
  title: "Convert Case",
  description:
    "Easily convert text between different letter cases: lower case, UPPER CASE, Sentence case, Capitalized Case, aLtErNaTiNg cAsE and more online.",
  // other metadata
};

const ConvertCase = () => {
  return <ConvertCaseComponent />;
};

export default ConvertCase;
