import { Metadata } from "next";
import SignatureVerifierComponent from "./components/signature-verifier";

export const metadata: Metadata = {
  title: "Ethereum Signature Verifier",
  description:
    "Recover the signer of an Ethereum signature (personal_sign, EIP-712 typed data or a raw hash), check it against an address, or sign test messages.",
};

const SignatureVerifier = () => <SignatureVerifierComponent />;

export default SignatureVerifier;
