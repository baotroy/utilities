import { Metadata } from "next";
import JsonDiffComponent from "./components/json-diff";

export const metadata: Metadata = {
  title: "JSON Diff",
  description: "Compare two JSON documents by structure, ignoring key order and formatting, and list what was added, removed or changed.",
};

const JsonDiff = () => <JsonDiffComponent />;

export default JsonDiff;
