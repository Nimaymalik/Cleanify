'use client';
import { useState, useEffect } from 'react';
import { Loader, Award, User, Trophy, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { getAllRewards, getUserByEmail } from '../../utils/database/action';

type Reward = {
  id: number;
  userId: number;
  points: number;
  level: number;
  createdAt: Date;
  userName: string | null;
};

export default function LeaderboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState<{ id: number; email: string; name: string } | null>(null);

  const aggregateRewards = (rewards: Reward[]) => {
    const aggregated = rewards.reduce((acc, reward) => {
      const userKey = reward.userId;
      if (!acc[userKey]) {
        acc[userKey] = { ...reward, points: reward.points };
      } else {
        acc[userKey].points += reward.points; 
      }
      return acc;
    }, {} as { [key: number]: Reward });

    return Object.values(aggregated);
  };

  useEffect(() => {
    const fetchRewardsAndUser = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        toast.error('Please log in to view the leaderboard.');
        return;
      }

      setLoading(true);
      try {
        // Fetch rewards and aggregate
        const fetchedRewards = await getAllRewards();
        const aggregatedRewards = aggregateRewards(fetchedRewards);
        aggregatedRewards.sort((a, b) => b.points - a.points); // Sort by points descending
        setRewards(aggregatedRewards);

        // Fetch user data
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setDbUser(fetchedUser);
          } else {
            toast.error('User not found. Please log in again.');
          }
        } else {
          toast.error('User email not available. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching rewards and user:', error);
        toast.error('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsAndUser();
  }, [user, isSignedIn, isLoaded]);

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
            You need to be logged in to view the leaderboard.
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <User className="w-6 h-6 text-gray-400" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-100 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Leaderboard</h1>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Top Contributors</h2>
          <p className="text-gray-600 mt-1">Ranked by total points earned</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {rewards.length > 0 ? (
            rewards.map((reward, index) => {
              const rank = index + 1;
              const isCurrentUser = dbUser && reward.userId === dbUser.id;
              
              return (
                <div
                  key={reward.userId}
                  className={`p-6 flex items-center justify-between ${
                    isCurrentUser ? 'bg-green-50 border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(rank)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadge(rank)}`}>
                        #{rank}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {reward.userName || `User ${reward.userId}`}
                        {isCurrentUser && (
                          <span className="ml-2 text-sm text-green-600 font-medium">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Level {reward.level} • {reward.points} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {reward.points.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No leaderboard data available yet.</p>
              <p className="text-sm mt-1">Start earning points by reporting and collecting waste!</p>
            </div>
          )}
        </div>
      </div>
      
      {dbUser && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rewards.find(r => r.userId === dbUser.id)?.points || 0}
              </div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {rewards.findIndex(r => r.userId === dbUser.id) + 1 || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rewards.find(r => r.userId === dbUser.id)?.level || 1}
              </div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {rewards.length}
              </div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
