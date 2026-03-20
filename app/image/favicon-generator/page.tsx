import type { Metadata } from "next";
import FaviconGeneratorComponent from "../components/favicon-generator";

export const metadata: Metadata = {
  title: "Favicon Generator | Generate Favicons from Images",
  description:
    "Generate multiple favicon sizes from a single image. Creates favicons for browsers, iOS, Android, and PWAs with HTML code.",
  keywords: [
    "favicon generator",
    "favicon maker",
    "apple touch icon",
    "android chrome icon",
    "pwa icons",
    "website icon generator",
  ],
};

export default function FaviconGeneratorPage() {
  return <FaviconGeneratorComponent />;
}
