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
  description: "Advanced Leave Management System",
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
