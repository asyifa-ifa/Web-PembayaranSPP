import { SessionProvider } from "next-auth/react";
import Head from "next/head"; // 1. Import Head dari next/head

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      {/* 2. Tambahkan Head untuk mengontrol Viewport Responsif */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <title>SIBATAMU-SPP</title>
      </Head>
      
      <Component {...pageProps} />
    </SessionProvider>
  );
}