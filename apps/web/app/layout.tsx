import type { Metadata } from "next";
import { Lexend, Noto_Sans_Devanagari, Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "@/app/globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-devanagari",
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
}>): React.JSX.Element {
  return (
    <html lang="mr">
      <body
        className={`${lexend.variable} ${poppins.variable} ${notoSansDevanagari.variable} font-body`}
      >
        <NextTopLoader
          color="#4f46e5"
          crawlSpeed={160}
          easing="ease"
          height={3}
          initialPosition={0.12}
          shadow="0 0 12px rgba(79, 70, 229, 0.35), 0 0 6px rgba(79, 70, 229, 0.22)"
          showSpinner={false}
          speed={220}
          zIndex={2000}
        />
        {children}
      </body>
    </html>
  );
}
