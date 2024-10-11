import { Metadata } from "next";
import UniversalCallDataDecoderComponent from "./components/universal-call-data-decoder";

export const metadata: Metadata = {
  title: "Universal Input Data Decoder",
  description: "Universal input data decoder, decode input data with no ABI.",
  // other metadata
};
const UniversalCallDataDecoder = () => {
  return <UniversalCallDataDecoderComponent />;
};

export default UniversalCallDataDecoder;
