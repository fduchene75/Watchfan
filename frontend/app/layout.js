// app/layout.js (version debug)
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Watchfan Debug",
  description: "Test de debug",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RainbowKitAndWagmiProvider>
          <div style={{padding: '20px', border: '2px solid red'}}>
            <h2>DEBUG: Layout fonctionne</h2>
            {children}
          </div>
        </RainbowKitAndWagmiProvider>
      </body>
    </html>
  );
}