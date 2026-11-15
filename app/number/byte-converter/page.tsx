import { Metadata } from "next";
import ByteConverterComponent from "./components/byte-converter";

export const metadata: Metadata = {
  title: "Byte Size Converter",
  description: "Convert between bits, bytes, KB, MB, GB, TB and their binary KiB, MiB, GiB counterparts, plus transfer time at a given speed.",
};

const ByteConverter = () => <ByteConverterComponent />;

export default ByteConverter;
