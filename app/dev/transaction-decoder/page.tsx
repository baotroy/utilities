import { Metadata } from "next";
import TransactionDecoderComponent from "./components/transaction-decoder";

export const metadata: Metadata = {
  title: "Transaction Decoder",
  description:
    "Decode any EVM transaction by its hash: function and arguments, events, token transfers, internal calls and the revert reason of a failed transaction. Reads a public RPC, no API key.",
};

const TransactionDecoder = () => {
  return <TransactionDecoderComponent />;
};

export default TransactionDecoder;
