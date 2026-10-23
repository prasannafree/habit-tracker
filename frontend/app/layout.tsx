import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Navigation from "@/components/navigation/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Habit Tracker — Build Better Habits",
  description:
    "Track your daily habits, monitor progress with a monthly calendar heatmap, and build consistent routines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col md:flex-row" suppressHydrationWarning>
        <AppProvider>
          <Navigation />
          <main className="flex-1 min-h-screen pb-20 md:pb-0">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
