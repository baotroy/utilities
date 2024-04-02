import { Metadata } from "next";
import EtherUnitConverterComponent from "../components/ethereum-unit-converter";
export const metadata: Metadata = {
  title: "Ether Unit Converter",
  description: "Unit Conversion in the Ethereum Network.",
  // other metadata
};

const EtherUnitConverter = () => {
  return <EtherUnitConverterComponent />;
};

export default EtherUnitConverter;
