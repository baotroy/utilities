import { Metadata } from "next";
import AddressToolsComponent from "./components/address-tools";

export const metadata: Metadata = {
  title: "Ethereum Address Tools",
  description:
    "Checksum Ethereum addresses, predict CREATE and CREATE2 contract addresses, and resolve ENS names.",
};

const AddressTools = () => <AddressToolsComponent />;

export default AddressTools;
