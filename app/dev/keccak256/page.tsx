import { Metadata } from "next";
import Keccak256Component from "../components/keccak256";

export const metadata: Metadata = {
  title: "Keccak-256 Hash",
  description: "Calculate Keccak-256 hash from strings with support for UTF-8, UTF-16, Hex, Base64, and ASCII encodings.",
};

const Keccak256 = () => {
  return <Keccak256Component />;
};

export default Keccak256;
