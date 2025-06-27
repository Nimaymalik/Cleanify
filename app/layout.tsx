"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import SideBar from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 relative">
              <SideBar open={sidebarOpen} setOpen={setSidebarOpen} />
              <main className="flex-1 pt-28 px-2 sm:px-4 md:px-8 lg:ml-64 space-y-8 transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
