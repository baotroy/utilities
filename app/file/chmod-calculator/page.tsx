import { Metadata } from "next";
import ChmodCalculatorComponent from "../components/chmod-calculator";

export const metadata: Metadata = {
  title: "Chmod Calculator",
  description:
    "Convert Linux file permissions between octal (numeric) and symbolic formats. Interactive chmod calculator with permission checkboxes and command examples.",
};

const ChmodCalculator = () => {
  return <ChmodCalculatorComponent />;
};

export default ChmodCalculator;
