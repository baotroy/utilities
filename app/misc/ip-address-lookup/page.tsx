import { Metadata } from "next";
import IpAddressLookupComponent from "../components/ip-address-lookup";

export const metadata: Metadata = {
  title: "IP Address Lookup",
  description: "Look up IP address information including geolocation, ISP, and timezone.",
};

const IpAddressLookup = () => {
  return <IpAddressLookupComponent />;
};

export default IpAddressLookup;
