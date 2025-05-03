import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maritime Charter Finance | XRPL",
  description: "Turn shipping voyages into bankable transactions. Finance maritime operations through verified transactions on XRPL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="ocean-bg" />
        <div className="grid-overlay" />
        {children}
      </body>
    </html>
  );
}
