import { Metadata } from "next";
import AbiSelectorsComponent from "./components/abi-selectors";

export const metadata: Metadata = {
  title: "ABI Selectors",
  description:
    "Extract function selectors, error selectors and event topic hashes from a Solidity contract ABI.",
};
const AbiSelectors = () => {
  return <AbiSelectorsComponent />;
};

export default AbiSelectors;
