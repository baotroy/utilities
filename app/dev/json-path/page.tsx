import { Metadata } from "next";
import JsonPathComponent from "./components/json-path";

export const metadata: Metadata = {
  title: "JSONPath Tester",
  description: "Query JSON with JSONPath expressions such as $.store.book[?(@.price < 10)].title and see every match with its path.",
};

const JsonPath = () => <JsonPathComponent />;

export default JsonPath;
