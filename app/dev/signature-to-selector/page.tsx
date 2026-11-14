import { Metadata } from "next";
import SignatureToSelectorComponent from "./components/signature-to-selector";

export const metadata: Metadata = {
  title: "Signature to Selector",
  description:
    "Convert a Solidity function, event or error signature to its hex selector, e.g. transfer(address,uint256) to 0xa9059cbb.",
};
const SignatureToSelector = () => {
  return <SignatureToSelectorComponent />;
};

export default SignatureToSelector;
