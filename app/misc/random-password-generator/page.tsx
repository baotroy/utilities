import { Metadata } from "next";
import RandomPasswordGeneratorComponent from "../components/random-password-generator";

export const metadata: Metadata = {
  title: "Random Password Generator",
  description:
    "Generate strong & secure passwords for all your online accounts with our random password generator. Mix letters, numbers and symbols for the ultimate in security.",
  // other metadata
};

const RandomPasswordGenerator = () => {
  return <RandomPasswordGeneratorComponent />;
};

export default RandomPasswordGenerator;
