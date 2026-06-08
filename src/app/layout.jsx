import { Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { FloatingChat } from "@/components/ui/FloatingChat";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Sicerdas",
  description: "Advanced Leave Management System - Kelola cuti instansi Anda secara praktis, cepat, dan otomatis.",
  icons: {
    icon: [
      { url: "/favicon-io/favicon.ico" },
      { url: "/favicon-io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon-io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon-io/site.webmanifest",
};

// Navbar removed from global layout

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <NextTopLoader 
          color="var(--primary)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
        />
        {children}
        <FloatingChat />
      </body>
    </html>
  );
}
