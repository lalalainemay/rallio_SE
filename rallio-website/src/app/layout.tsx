import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/hooks/useAuth";
// import { Toaster } from "../../components/ui/toaster";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans"
});

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
      <body className={plusJakartaSans.variable}>
        <AuthProvider>
          <QueryProvider>
            {children}
            {/* <Toaster /> */}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}