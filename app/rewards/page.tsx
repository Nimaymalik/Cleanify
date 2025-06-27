"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Loader,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { Button } from "../../components/ui/button";
import {
  getUserByEmail,
  getRewardTransactions,
  getAvailableRewards,
  redeemReward,
  createTransaction,
} from "../../utils/database/action";

enum TransactionType {
  EarnedReport = "earned_report",
  EarnedCollect = "earned_collect",
  Redeemed = "redeemed",
}

type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
};

type Reward = {
  id: number;
  name: string;
  cost: number;
  description: string;
  collectionInfo: string;
};

export default function RewardsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAndRewards = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        toast.error("Please log in to access rewards.");
        return;
      }

      setLoading(true);
      try {
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setDbUser(fetchedUser);

            const fetchedTransactions = await getRewardTransactions(
              fetchedUser.id
            );
            setTransactions(fetchedTransactions as Transaction[]);

            const fetchedRewards = await getAvailableRewards(fetchedUser.id);
            setRewards(
              fetchedRewards
                .filter((r) => r.cost > 0)
                .map((r) => ({ ...r, description: r.description ?? "" }))
            );

            const calculatedBalance = fetchedTransactions.reduce(
              (acc, transaction) =>
                transaction.type.startsWith("earned")
                  ? acc + transaction.amount
                  : acc - transaction.amount,
              0
            );

            setBalance(Math.max(calculatedBalance, 0));
          } else {
            toast.error("User not found. Please log in again.");
          }
        } else {
          toast.error("User email not available. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user data and rewards:", error);
        toast.error("Failed to load rewards data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndRewards();
  }, [user, isSignedIn, isLoaded]);

  const handleRedeemReward = async (rewardId: number) => {
    if (!dbUser) {
      toast.error("Please log in to redeem rewards.");
      return;
    }

    const reward = rewards.find((r) => r.id === rewardId);
    if (reward && balance >= reward.cost && reward.cost > 0) {
      try {
        await redeemReward(dbUser.id, rewardId);

        await createTransaction(
          dbUser.id,
          "redeemed",
          reward.cost,
          `Redeemed ${reward.name}`
        );

        await refreshUserData();

        toast.success(`You have successfully redeemed: ${reward.name}`);
      } catch (error) {
        console.error("Error redeeming reward:", error);
        toast.error("Failed to redeem reward. Please try again.");
      }
    } else {
      toast.error("Insufficient balance or invalid reward cost");
    }
  };

  const handleRedeemAllPoints = async () => {
    if (!dbUser) {
      toast.error("Please log in to redeem points.");
      return;
    }

    if (balance > 0) {
      try {
        await redeemReward(dbUser.id, 0);

        await createTransaction(
          dbUser.id,
          "redeemed",
          balance,
          "Redeemed all points"
        );

        await refreshUserData();

        toast.success("You have successfully redeemed all your points!");
      } catch (error) {
        console.error("Error redeeming all points:", error);
        toast.error("Failed to redeem all points. Please try again.");
      }
    } else {
      toast.error("No points available to redeem");
    }
  };

  const refreshUserData = async () => {
    if (!dbUser) return;

    try {
      const fetchedTransactions = await getRewardTransactions(dbUser.id);
      setTransactions(fetchedTransactions as Transaction[]);

      const fetchedRewards = await getAvailableRewards(dbUser.id);
      setRewards(
        fetchedRewards
          .filter((r) => r.cost > 0)
          .map((r) => ({ ...r, description: r.description ?? "" }))
      );

      const calculatedBalance = fetchedTransactions.reduce(
        (acc, transaction) =>
          transaction.type.startsWith("earned")
            ? acc + transaction.amount
            : acc - transaction.amount,
        0
      );

      setBalance(Math.max(calculatedBalance, 0));
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-6 text-gray-800">
            Please Log In
          </h1>
          <p className="text-gray-600">
            You need to be logged in to access your rewards.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Rewards</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Reward Balance
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Coins className="w-10 h-10 mr-3 text-green-500" />
            <div>
              <span className="text-4xl font-bold text-green-500">{balance}</span>
              <p className="text-sm text-gray-500">Available Points</p>
            </div>
          </div>
          <Button onClick={handleRedeemAllPoints} disabled={balance === 0}>
            Redeem All Points
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Transaction History
          </h2>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white p-4 rounded-xl shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      {transaction.type.startsWith("earned") ? (
                        <ArrowUpRight className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium text-gray-800">
                        {transaction.type === "earned_report"
                          ? "Report Reward"
                          : transaction.type === "earned_collect"
                          ? "Collection Reward"
                          : "Redeemed"}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type.startsWith("earned")
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.type.startsWith("earned") ? "+" : "-"}
                      {transaction.amount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No transactions yet
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Available Rewards
          </h2>
          <div className="space-y-4">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white p-4 rounded-xl shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {reward.name}
                    </h3>
                    <span className="text-green-500 font-semibold">
                      {reward.cost} points
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{reward.description}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {reward.collectionInfo}
                  </p>
                  <Button
                    onClick={() => handleRedeemReward(reward.id)}
                    disabled={balance < reward.cost}
                  >
                    Redeem
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No rewards available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}