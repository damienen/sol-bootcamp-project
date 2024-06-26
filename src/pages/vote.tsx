import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import { VoteView } from "views/vote";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta name="description" content="Solana Scaffold" />
      </Head>
      <VoteView />
    </div>
  );
};

export default Home;
