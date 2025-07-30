import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/startup"; // Start email cron manager

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Support Dashboard",
  description: "Internal IT Support Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <AppThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-center" />
        </AppThemeProvider>
      </body>
    </html>
  );
}
