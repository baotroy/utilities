import { Metadata } from "next";
import BitwiseCalculatorComponent from "./components/bitwise-calculator";

export const metadata: Metadata = {
  title: "Bitwise Calculator",
  description: "Compute AND, OR, XOR, NOT and bit shifts on integers of any width, with the bits shown side by side in binary, hex and decimal.",
};

const BitwiseCalculator = () => <BitwiseCalculatorComponent />;

export default BitwiseCalculator;
