import { Metadata } from "next";
import RobotsTxtGeneratorComponent from "./components/robots-txt-generator";

export const metadata: Metadata = {
  title: "robots.txt Generator",
  description:
    "Generate a robots.txt with rules per crawler, AI bot blocking, sitemaps and crawl delay, and test whether a URL is allowed.",
};

const RobotsTxtGenerator = () => {
  return <RobotsTxtGeneratorComponent />;
};

export default RobotsTxtGenerator;
