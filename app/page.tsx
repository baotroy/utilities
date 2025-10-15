import { Metadata } from "next";
import Head from "next/head";
import ConvertComponent from "./string/components/convert-case";
export const metadata: Metadata = {
  title: "Holaa - Utilities for developers and more.",
  description: "Utilities for developers and more.",
  manifest: "/manifest.json",
  icons: "/favicon.ico",

};

export default function Home() {
  return (
    <>
      <Head>
        <title></title>
      </Head>
      <h1 className="text-2xl font-bold">Latest Function</h1>
      <ConvertComponent />
    </>
  );
}
