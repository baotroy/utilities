import { Metadata } from "next";
import EpochConverterComponent from "../components/epoch-converter";

export const metadata: Metadata = {
  title: "Epoch Converter",
  description:
    "Convert Timestamp To Human Readable Date. Supports Unix timestamps in seconds, milliseconds, microseconds and nanoseconds. Convert Human Readable Date To Timestamp",
  // other metadata
};

const EpochConverter = () => {
  return <EpochConverterComponent />;
};

export default EpochConverter;
