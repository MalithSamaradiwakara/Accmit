import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elephant Watch | Presence monitoring",
  description: "Live elephant presence monitoring from connected field sensors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}