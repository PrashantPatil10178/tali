import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import "@/app/globals.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "गुरुजी AI - उत्तरपत्रिका तपासणी सहाय्यक",
  description:
    "एक प्रगत शैक्षणिक ॲप जे शिक्षकांना विद्यार्थ्यांच्या उत्तरपत्रिका स्कॅन करण्यास, तपासण्यास आणि त्वरित निकाल देण्यास मदत करते.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr">
      <body className={notoSansDevanagari.className}>{children}</body>
    </html>
  );
}
