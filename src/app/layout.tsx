import type { Metadata } from "next";
import { Geist, Geist_Mono, Parkinsans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const parkinsans = Parkinsans({
  variable: "--font-parkinsans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Voltura Service Hub",
  description:
    "Unified WhatsApp bot, CRM, and POS platform for device repair businesses with AI automation and Supabase infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.className} ${geistMono.className} ${parkinsans.className} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
