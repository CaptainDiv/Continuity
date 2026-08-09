import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Continuity - DeFi Compliance Insurance",
  description: "Protect lending positions against the financial impact of verified compliance events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="bg-background-custom text-on-background antialiased min-h-screen pb-24 md:pb-8">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
