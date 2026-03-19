import { Metadata } from "next";
import { Suspense } from "react";
import EthereumPrivateKeyAddressComponent from "./components/ethereum-private-key-address";

export const metadata: Metadata = {
  title: "Etherum Private Key Address Database",
  description: "Etherum Private Key Address Database balance",
};

const EthereumPrivateKeyAddress = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EthereumPrivateKeyAddressComponent />
    </Suspense>
  );
};

export default EthereumPrivateKeyAddress;
