import { Metadata } from "next";
import StorageSlotReaderComponent from "./components/storage-slot-reader";

export const metadata: Metadata = {
  title: "Storage Slot Reader",
  description:
    "Compute Solidity storage slots for mappings, arrays and ERC-7201 namespaces, read them from any EVM chain, and find a proxy's implementation (EIP-1967).",
};

const StorageSlotReader = () => <StorageSlotReaderComponent />;

export default StorageSlotReader;
