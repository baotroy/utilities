import { Metadata } from "next";
import RegexBuilderComponent from "../components/regex-builder";

export const metadata: Metadata = {
  title: "Regex Builder",
  description:
    "Visual regex constructor with live testing, match highlighting, and plain-English explanations.",
};

const RegexBuilder = () => {
  return <RegexBuilderComponent />;
};

export default RegexBuilder;
