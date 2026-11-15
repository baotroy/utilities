import { Metadata } from "next";
import StringEscapeComponent from "./components/string-escape";

export const metadata: Metadata = {
  title: "String Escape / Unescape",
  description: "Escape or unescape text for JSON, JavaScript, HTML, XML, SQL, CSV, regex and Unicode escapes.",
};

const StringEscape = () => <StringEscapeComponent />;

export default StringEscape;
