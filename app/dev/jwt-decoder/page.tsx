import { Metadata } from "next";
import JsonPrettierComponent from "../components/json-prettier";

export const metadata: Metadata = {
  title: "JWT Decoder",
  description:
    "JWT Decoder - Decode JSON Web Token online. Decode JWT token to get header, payload and signature.",
  // other metadata
};

const JwtDecoder = () => {
  return <JsonPrettierComponent />;
};

export default JwtDecoder;
