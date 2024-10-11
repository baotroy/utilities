import { Metadata } from "next";
import Head from "next/head";
import NumberConversionComponent from "./number/components/number-conversion";
export const metadata: Metadata = {
  title: "Holaa - Utilities for developers and more.",
  description: "Utilities for developers and more.",
  // icons: {
  //   icon: "/favicon.jpg",
  //   // shortcut: "/shortcut-icon.png",
  //   // apple: "/apple-icon.png",
  //   // other: {
  //   //   rel: "apple-touch-icon-precomposed",
  //   //   url: "/apple-touch-icon-precomposed.png",
  //   // },
  // },
  // other metadata
};

export default function Home() {
  return (
    <>
      <Head>
        <title></title>
      </Head>
      <h1 className="text-2xl font-bold">Latest Function</h1>
      <NumberConversionComponent />
    </>
  );
}
