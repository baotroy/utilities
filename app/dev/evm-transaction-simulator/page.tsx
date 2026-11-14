import { Metadata } from "next";
import EvmTransactionSimulatorComponent from "./components/evm-transaction-simulator";

export const metadata: Metadata = {
  title: "EVM Transaction Simulator",
  description:
    "Simulate an EVM transaction against any chain through a public RPC: status, revert reason, return data, gas, call trace, events and token transfers.",
};

const EvmTransactionSimulator = () => {
  return <EvmTransactionSimulatorComponent />;
};

export default EvmTransactionSimulator;
