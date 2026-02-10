import { Metadata } from "next";
import HtpasspwComponent from "../components/htpasswd-generator";

export const metadata: Metadata = {
  title: "NGINX Htpasswd Generator",
  description:
    "Generate htpasswd entries for NGINX basic authentication. Create secure password hashes using SHA1, SSHA, or MD5 algorithms.",
};

const HtpasswdGenerator = () => {
  return <HtpasspwComponent />;
};

export default HtpasswdGenerator;
