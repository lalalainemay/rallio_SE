import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
// import { Toaster } from "../../components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Rallio - Badminton Court Finder & Queue Management",
  description: "Find badminton courts and manage queues in Zamboanga City",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <QueryProvider>
          {children}
          {/* <Toaster /> */}
        </QueryProvider>
      </body>
    </html>
  );
}