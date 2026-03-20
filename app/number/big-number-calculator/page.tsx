import { Metadata } from "next";
import BigNumberCalculatorComponent from "../components/big-number-calculator";

export const metadata: Metadata = {
  title: "Big Number Calculator",
  description: "Perform arithmetic operations on arbitrarily large numbers with full precision.",
};

const BigNumberCalculator = () => {
  return <BigNumberCalculatorComponent />;
};

export default BigNumberCalculator;
