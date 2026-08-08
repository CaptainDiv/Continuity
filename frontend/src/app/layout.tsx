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
      <body className="bg-background-custom text-on-background antialiased min-h-screen pb-24 md:pb-8">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
