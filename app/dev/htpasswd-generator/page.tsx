import { Metadata } from "next";
import HtpasspwComponent from "../components/htpasswd-generator";

export const metadata: Metadata = {
  title: "Htpasswd Generator",
  description: "htpasswd generator",
  // other metadata
};

const HtpasswdGenerator = () => {
  return <HtpasspwComponent />;
};

export default HtpasswdGenerator;
