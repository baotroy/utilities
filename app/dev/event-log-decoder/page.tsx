import { Metadata } from "next";
import EventLogDecoderComponent from "./components/event-log-decoder";

export const metadata: Metadata = {
  title: "Event Log Decoder",
  description:
    "Decode Ethereum event logs from topics and data, or every log of a transaction, with an ABI or the 4byte signature database.",
};

const EventLogDecoder = () => <EventLogDecoderComponent />;

export default EventLogDecoder;
