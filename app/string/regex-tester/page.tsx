import { Metadata } from "next";
import RegexTesterComponent from "../components/regex-tester";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "Test and validate regular expressions with real-time matching and highlighting.",
};

const RegexTester = () => {
  return <RegexTesterComponent />;
};

export default RegexTester;
