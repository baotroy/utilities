import { Metadata } from "next";
import ArraySorterComponent from "./components/array-sorter";

export const metadata: Metadata = {
  title: "Array Sorter",
  description:
    "Sort a JSON array of numbers, strings or objects by value or by one or more fields, ascending or descending.",
};
const ArraySorter = () => {
  return <ArraySorterComponent />;
};

export default ArraySorter;
