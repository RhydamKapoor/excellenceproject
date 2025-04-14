import { Roboto } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./components/SessionWrapper";
import { Toaster } from "react-hot-toast";
import { RoleProvider } from "@/context/RoleContext";
import React from "react";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Taskflow",
  description:
    "Taskflow is a task management system that allows you to manage your tasks and projects.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
          <SessionWrapper>
            <RoleProvider>{children}</RoleProvider>
            <Toaster position="bottom-right" />
          </SessionWrapper>
      </body>
    </html>
  );
}
