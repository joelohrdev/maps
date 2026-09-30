import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SyncManager from "@/components/SyncManager";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sketch Atlas",
  description: "Find random Street View spots around the world and save them for urban sketching.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SyncManager />
      </body>
    </html>
  );
}
