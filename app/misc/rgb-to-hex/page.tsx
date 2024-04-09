import { Metadata } from "next";
import RgbToHexComponent from "./components/rgb-to-hex";

export const metadata: Metadata = {
  title: "RGB to HEX Converter",
  description:
    "Generate strong & secure passwords for all your online accounts with our random password generator. Mix letters, numbers and symbols for the ultimate in security.",
  // other metadata
};

const RgbToHex = () => {
  return <RgbToHexComponent />;
};

export default RgbToHex;
