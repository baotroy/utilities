import { Metadata } from "next";
import JwtDecoderComponent from "../components/jwt-decoder";

export const metadata: Metadata = {
  title: "JWT Decoder",
  description:
    "JWT Decoder - Decode JSON Web Token online. Decode JWT token to get header, payload and signature.",
  // other metadata
};

const JwtDecoder = () => {
  return <JwtDecoderComponent />;
};

export default JwtDecoder;
