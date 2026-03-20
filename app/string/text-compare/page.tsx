import { Metadata } from "next";
import TextCompareComponent from "../components/text-compare";

export const metadata: Metadata = {
  title: "Text Compare",
  description:
    "Compare two texts side by side and highlight the differences. Find changes between two versions of text quickly.",
};

const TextCompare = () => {
  return <TextCompareComponent />;
};

export default TextCompare;
