import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Kienez",
  description:
    "Genera perfiles de candidatos políticos con IA basado en las publicaciones de usuarios",
  generator: "kienez.dev",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Kienez",
    description: "Plataforma que genera perfiles de candidatos políticos con IA basado en las publicaciones de usuarios",
    url: "https://kienez.com",
    images: [
      {
        url: "https://storage.googleapis.com/kienez/portfolio/contact.jpg",
        width: 1200,
        height: 630,
        alt: "Vista previa",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="//vjs.zencdn.net/8.23.4/video-js.min.css"
          rel="stylesheet"
        ></link>
        <link rel="icon" href="/favicon.ico" sizes="any" />

        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
        <script src="//vjs.zencdn.net/8.23.4/video.min.js"></script>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9640395525590369"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
