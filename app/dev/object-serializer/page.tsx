import { Metadata } from "next";
import ObjectSerializerComponent from "./components/object-serializer";

export const metadata: Metadata = {
  title: "Object Serializer",
  description:
    "Stringify JavaScript objects and JSON with pretty-printing and minification options. Convert objects to formatted JSON strings quickly and easily.",
};

export default function ObjectSerializerPage() {
  return <ObjectSerializerComponent />;
}
