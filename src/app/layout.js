import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./components/SessionWrapper";
import { Toaster } from "react-hot-toast";
import { RoleProvider } from "@/context/RoleContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import React from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { APP_NAME } from "@/lib/appConfig";

export const metadata = {
  title: APP_NAME,
  description: `${APP_NAME} is a task management system that allows you to manage your tasks and projects.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} overflow-x-hidden font-sans antialiased`}>
        <ThemeProvider>
          <SessionWrapper>
            <RoleProvider>{children}</RoleProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "!rounded-2xl !bg-card !text-card-foreground !border !border-border !shadow-lg",
                duration: 3000,
              }}
            />
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
