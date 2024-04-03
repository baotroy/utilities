import { Metadata } from "next";
import NumberConversionComponent from "../components/number-conversion";
export const metadata: Metadata = {
  title: "Number Conversion",
  description: "Binary, Octal, Decimal, Hexadecimal conversion.",
  // other metadata
};

const NumberConversion = () => {
  return <NumberConversionComponent />;
};

export default NumberConversion;
