import { Metadata } from "next";
import DnsLookupComponent from "../components/dns-lookup";

export const metadata: Metadata = {
  title: "DNS Lookup",
  description:
    "Query DNS records for any domain — A, AAAA, MX, CNAME, TXT, NS, SOA, and more.",
};

const DnsLookup = () => {
  return <DnsLookupComponent />;
};

export default DnsLookup;
