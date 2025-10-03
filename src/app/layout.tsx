import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAProvider } from "@/components/pwa-provider";
import "leaflet/dist/leaflet.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amrit Dhara - Water Quality Monitoring",
  description: "Advanced groundwater quality analysis system for comprehensive environmental assessment using Heavy Metal Pollution Indices (HPI, HEI, CD, NPI) with mobile data entry and real-time analytics.",
  keywords: ["Heavy Metal", "Pollution Index", "Groundwater", "Environmental Assessment", "HPI", "HEI", "CD", "NPI", "Water Quality", "Mobile Monitoring", "Real-time Analysis"],
  authors: [{ name: "Environmental Science Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amrit Dhara",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Amrit Dhara - Water Quality Monitoring",
    description: "Advanced mobile-first water quality analysis system with real-time monitoring",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amrit Dhara - Water Quality Monitoring",
    description: "Mobile-first groundwater quality assessment tool",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWAProvider />
          {children}
          <Toaster />
        </ThemeProvider>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js"
          strategy="afterInteractive"
        />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}