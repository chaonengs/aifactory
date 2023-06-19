import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="theme-color" content="#2296f3" />
        <meta name="title" content="Naodong AI" />
        <meta
          name="description"
          content="Naodong AI by Chilunyc"
        />
        <meta
          name="keywords"
          content="openai, open ai, chatgpt, gpt, feishu, lark"
        />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://naodong.chilunyc.com/" />
        <meta property="og:site_name" content="Naodong AI" />
        <meta property="article:publisher" content="Chaoneng" />
        <meta property="og:title" content="Naodong AI by Chilunyc" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
