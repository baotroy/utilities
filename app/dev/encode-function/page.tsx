import { Metadata } from "next";
import FunctionToHexComponent from "./components/function-to-hex";

export const metadata: Metadata = {
  title: "Function Name to Hex",
  description: "Convert function name to hex",
  // other metadata
};
const FunctionToHex = () => {
  return <FunctionToHexComponent />;
};

export default FunctionToHex;
