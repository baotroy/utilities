import { Metadata } from "next";
import BlockTimestampComponent from "./components/block-timestamp";

export const metadata: Metadata = {
  title: "Block ↔ Timestamp",
  description:
    "Find the EVM block closest to a date, the timestamp of a block, or the block range of a time period for eth_getLogs, on Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base and more.",
};

const BlockTimestamp = () => {
  return <BlockTimestampComponent />;
};

export default BlockTimestamp;
