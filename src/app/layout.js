import { Roboto } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./components/SessionWrapper";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: '400'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} antialiased`}
      >
        <SessionWrapper>
          {children}
          <Toaster position="bottom-right" />
        </SessionWrapper>
      </body>
    </html>
  );
}
