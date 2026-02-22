import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { ModeProvider } from "@/lib/hooks/use-mode";
import { PlatformProvider } from "@/lib/hooks/use-platform";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolPass Partner Dashboard",
  description: "Partner dashboard for SolPass ticketing API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ModeProvider>
            <PlatformProvider>
              <QueryProvider>
                {children}
                <Toaster position="top-right" />
              </QueryProvider>
            </PlatformProvider>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}