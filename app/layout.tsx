"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import SideBar from "../components/Sidebar";
import { getUserByEmail, getAvailableRewards } from "../utils/database/action";

// Define the Reward type
export type Reward = {
  id: number;
  name: string;
  cost: number;
  points?: number; // Optional if not all rewards include `points`
  description: string | null;
  collectionInfo: string;
};

// Define the response type for the getAvailableRewards function
export type RewardResponse = {
  id: number;
  name: string;
  cost: number;
  points?: number;
  description: string | null;
  collectionInfo: string;
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(false); // Error state

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      setLoading(true); // Set loading state
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const user = await getUserByEmail(userEmail);
          if (user) {
            const rewards: RewardResponse[] = await getAvailableRewards(user.id);

            // Map the rewards response to the Reward type
            const formattedRewards: Reward[] = rewards.map((reward) => ({
              id: reward.id,
              name: reward.name,
              cost: reward.cost,
              points: reward.points || 0, // Default to 0 if points are missing
              description: reward.description ?? null, // Ensure `description` is null if undefined
              collectionInfo: reward.collectionInfo,
            }));

            console.log("Fetched rewards:", formattedRewards);
          }
        }
      } catch (error) {
        console.error("Error fetching total earnings:", error);
        setError(true); // Set error state
      } finally {
        setLoading(false); // Set loading state to false once done
      }
    };

    fetchTotalEarnings();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex flex-1">
            <SideBar />
            <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
              {loading ? (
                <div>Loading...</div> // Loading state
              ) : error ? (
                <div>Error fetching data</div> // Error state
              ) : (
                children
              )}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
