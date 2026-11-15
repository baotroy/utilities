import { Metadata } from "next";
import RevertDecoderComponent from "./components/revert-decoder";

export const metadata: Metadata = {
  title: "Revert Reason Decoder",
  description:
    "Decode why an Ethereum transaction reverted: Error(string), Panic codes and custom errors, from revert data or a failed transaction hash.",
};

const RevertDecoder = () => <RevertDecoderComponent />;

export default RevertDecoder;
