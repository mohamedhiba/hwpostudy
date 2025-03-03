import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthContext from "@/context/AuthContext";
import { TimerProvider } from "@/context/TimerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyTogether",
  description: "Study with friends, track your progress, and stay motivated!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100 min-h-screen`}
      >
        <AuthContext>
          <TimerProvider>
            {children}
          </TimerProvider>
        </AuthContext>
      </body>
    </html>
  );
}
