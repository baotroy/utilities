import { Metadata } from "next";
import EthereumInputDataDecoderComponent from "./components/ethereum-input-data-decoder";

export const metadata: Metadata = {
  title: "Ethereum Input Data Decoder",
  description: "Ethereum input data decoder",
  // other metadata
};
const EthereumInputDataDecoder = () => {
  return <EthereumInputDataDecoderComponent />;
};

export default EthereumInputDataDecoder;
