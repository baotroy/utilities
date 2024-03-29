// import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import Head from "next/head";
export const metadata: Metadata = {
  title: "Home - Utilities for developers and more.",
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
        <title>My page title</title>
      </Head>
      {/* <ECommerce /> */}
      <h1>Coming Soon</h1>
    </>
  );
}
