import { Metadata } from "next";
import DecimalToFractionComponent from "./components/decimal-to-fraction";
export const metadata: Metadata = {
  title: "Decimal to Fraction Converter",
  description: "Decimal to fraction number conversion.",
  // other metadata
};

const DecimalToFraction = () => {
  return <DecimalToFractionComponent />;
};

export default DecimalToFraction;
