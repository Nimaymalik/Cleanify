"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  LogIn,
  Leaf,
  Coins,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SignIn, useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  createUser,
  getUnreadNotifications,
  markNotificationAsRead,
  getUserByEmail,
  getUserBalance,
} from "../utils/database/action";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState(0);
  const [signInOpen, setSignInOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) return;
      const email = user.emailAddresses[0].emailAddress;
      const dbUser = await getUserByEmail(email);
      if (!dbUser) return;

      const unread = await getUnreadNotifications(dbUser.id);
      setNotifications(unread as unknown as Notification[]);

      const bal = await getUserBalance(dbUser.id);
      setBalance(typeof bal === "number" ? bal : 0);

      if (user.fullName) {
        await createUser(email, user.fullName);
      }
    };

    if (isSignedIn && user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isSignedIn]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#login" && !isSignedIn) {
      setSignInOpen(true);
      window.location.hash = "";
    }
  }, [isSignedIn]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSignInOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center py-4">Loading...</div>;
  }

  return (
    <>
      <header className="w-full shadow-md bg-white fixed top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and Menu */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="mr-2 block md:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <Link href="/" className="flex items-center">
                <Leaf className="h-8 w-8 text-green-600 mr-2" />
                <span className="text-lg sm:text-xl font-bold text-gray-900">Cleanify</span>
              </Link>
            </div>

            {/* Center: Nav links (hide on mobile) */}
            <nav className="hidden md:flex space-x-4">
              <Link href="/collect" className={`nav-link${pathname === '/collect' ? ' active' : ''}`}>Collect</Link>
              <Link href="/report" className={`nav-link${pathname === '/report' ? ' active' : ''}`}>Report</Link>
              <Link href="/verify" className={`nav-link${pathname === '/verify' ? ' active' : ''}`}>Verify</Link>
              <Link href="/rewards" className={`nav-link${pathname === '/rewards' ? ' active' : ''}`}>Rewards</Link>
              <Link href="/leaderboard" className={`nav-link${pathname === '/leaderboard' ? ' active' : ''}`}>Leaderboard</Link>
            </nav>

            {/* Right: Notifications, Balance, Auth */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                        {notifications.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{n.type}</span>
                          <span className="text-sm text-gray-500">{n.message}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem>No new notifications</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Balance */}
              <div className="hidden sm:flex items-center bg-green-50 px-2 py-1 rounded-md">
                <Coins className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-semibold text-gray-800">{balance.toFixed(2)}</span>
              </div>

              {/* Auth */}
              {!isSignedIn ? (
                <>
                  <Button
                    onClick={() => setSignInOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                  >
                    <span className="hidden sm:inline">Login</span>
                    <LogIn className="sm:ml-1 h-4 w-4" />
                  </Button>

                  {signInOpen && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                      onClick={() => setSignInOpen(false)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <SignIn routing="hash" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex items-center">
                      <User className="h-5 w-5 mr-1" />
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{user?.fullName || "User"}</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/settings">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
