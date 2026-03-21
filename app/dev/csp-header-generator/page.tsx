import { Metadata } from "next";
import CspHeaderGeneratorComponent from "../components/csp-header-generator";

export const metadata: Metadata = {
  title: "CSP Header Generator",
  description:
    "Visually build Content-Security-Policy headers. Toggle directives, pick sources, and copy the result.",
};

const CspHeaderGenerator = () => {
  return <CspHeaderGeneratorComponent />;
};

export default CspHeaderGenerator;
