import type { Metadata } from "next";
import DiffViewerComponent from "../components/diff-viewer";

export const metadata: Metadata = {
  title: "Diff Viewer | Compare Code & Text Side by Side",
  description:
    "Compare two texts or code snippets side by side with character-level highlighting. Supports split and unified diff views.",
  keywords: [
    "diff viewer",
    "code compare",
    "text compare",
    "side by side diff",
    "unified diff",
    "code difference",
  ],
};

export default function DiffViewerPage() {
  return <DiffViewerComponent />;
}
