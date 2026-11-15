import { Metadata } from "next";
import PasswordStrengthAnalyzerComponent from "./components/password-strength-analyzer";

export const metadata: Metadata = {
  title: "Password Strength Analyzer",
  description:
    "Check how strong a password really is: detects common passwords, dictionary words, keyboard patterns, dates and repeats, and estimates the time to crack it. Runs entirely in your browser.",
};

const PasswordStrengthAnalyzer = () => {
  return <PasswordStrengthAnalyzerComponent />;
};

export default PasswordStrengthAnalyzer;
