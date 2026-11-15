import { Metadata } from "next";
import NginxConfigGeneratorComponent from "./components/nginx-config-generator";

export const metadata: Metadata = {
  title: "Nginx Config Generator",
  description:
    "Generate an NGINX server block for a reverse proxy, SPA, static site or PHP-FPM, with HTTPS, redirects, gzip and security headers.",
};

const NginxConfigGenerator = () => {
  return <NginxConfigGeneratorComponent />;
};

export default NginxConfigGenerator;
