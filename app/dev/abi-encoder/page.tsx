import { Metadata } from "next";
import AbiEncoderComponent from "./components/abi-encoder";

export const metadata: Metadata = {
  title: "ABI Encoder",
  description:
    "Build Ethereum calldata: pick a function from an ABI, fill in its arguments and get the encoded transaction data.",
};

const AbiEncoder = () => <AbiEncoderComponent />;

export default AbiEncoder;
