import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mumzworld Gift Finder",
  description:
    "AI-powered gift recommendations for moms and babies — in English and Arabic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
