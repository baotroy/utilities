import { Metadata } from "next";
import UrlEncoderComponent from "./components/url-encoder";

export const metadata: Metadata = {
  title: "URL Encoder & Parser",
  description:
    "Percent-encode or decode text for URLs, and split a URL into protocol, host, path, query parameters and hash.",
};

const UrlEncoder = () => <UrlEncoderComponent />;

export default UrlEncoder;
