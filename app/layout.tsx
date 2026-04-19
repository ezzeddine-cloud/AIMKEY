import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gabes bin ydik",
  description: "Gabes bin ydik — Smart City Gabès, espace agriculteur",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
