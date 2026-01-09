import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import AntdProvider from "@/providers/antd";
import ToastProvider from "@/providers/toast";
import { ToastContainer } from "@/components/ui/Toast";
import { LayoutOptionsProvider } from "@/providers/layoutOptions";
import ReactQueryProvider from "@/providers/react-query";
import LoadingScreen from "@/components/ui/LoadingScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sweetie <3",
  description: "Sweetie <3",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-theme="light">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <LoadingScreen>
          <ReactQueryProvider>
            <AntdProvider>
              <ToastProvider>
                <LayoutOptionsProvider>
                  {children}
                  <ToastContainer />
                </LayoutOptionsProvider>
              </ToastProvider>
            </AntdProvider>
          </ReactQueryProvider>
        </LoadingScreen>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
