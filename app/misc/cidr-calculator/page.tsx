import { Metadata } from "next";
import CidrCalculatorComponent from "./components/cidr-calculator";

export const metadata: Metadata = {
  title: "CIDR / Subnet Calculator",
  description: "Work out the network, broadcast, netmask, host range and size of an IPv4 or IPv6 CIDR block, and check whether an IP is inside it.",
};

const CidrCalculator = () => <CidrCalculatorComponent />;

export default CidrCalculator;
