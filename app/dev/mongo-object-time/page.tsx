import { Metadata } from "next";
import MongoObjectTimeComponent from "../components/mongo-object-time";

export const metadata: Metadata = {
  title: "Convert MongoDB ObjectId and Time",
  description: "Convert between mongodb objectId and time.",
  // other metadata
};
const MongoObjectTime = () => {
  return <MongoObjectTimeComponent />;
};

export default MongoObjectTime;
