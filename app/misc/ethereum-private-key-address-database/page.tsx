import { Metadata } from "next";
import EthereumPrivateKeyAddressComponent from "./components/ethereum-private-key-address";

export const metadata: Metadata = {
  title: "Etherum Private Key Address Database",
  description: "Etherum Private Key Address Database balance",
};

const EthereumPrivateKeyAddress = () => {
  return <EthereumPrivateKeyAddressComponent />;
};

export default EthereumPrivateKeyAddress;
