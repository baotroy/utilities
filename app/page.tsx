import { Metadata } from "next";
import HomeComponent from "@/components/Home";
export const metadata: Metadata = {
  title: "Holaa - Utilities for developers and more.",
  description: "Utilities for developers and more.",
  manifest: "/manifest.json",
  icons: "/favicon.ico",

};

export default function Home() {
  return <HomeComponent />;
}
