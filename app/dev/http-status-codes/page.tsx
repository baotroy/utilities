import { Metadata } from "next";
import HttpStatusCodesComponent from "../components/http-status-codes";

export const metadata: Metadata = {
  title: "HTTP Status Codes",
  description: "Complete reference of HTTP status codes with descriptions and explanations.",
};

const HttpStatusCodes = () => {
  return <HttpStatusCodesComponent />;
};

export default HttpStatusCodes;
