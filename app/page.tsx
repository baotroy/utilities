// import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import Head from "next/head";
export const metadata: Metadata = {
  title: "Home page",
  description: "This is Home page",
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
