import { Metadata } from "next";
import BasicAuthHeaderComponent from "../components/basic-auth-header";

export const metadata: Metadata = {
  title: "Basic Authentication Header Generator",
  description: "Basic authentication header generator",
  // other metadata
};

const BasicAuthHeader = () => {
  return <BasicAuthHeaderComponent />;
};

export default BasicAuthHeader;
