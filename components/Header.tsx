"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Coins,
  Leaf,
  Search,
  Bell,
  User,
  ChevronDown,
  LogIn,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Web3Auth } from "@web3auth/modal";

import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

import {
  createUser,
  getUnreadNotifications,
  markNotificationAsRead,
  getUserByEmail,
  getUserBalance,
} from "../utils/database/action";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useMediaQuery } from "../hooks/useMediaQuery";

const clientId = "BIAyKqf1mBYdn4iWGh6HwMRAg3-tPBmC57ncTHrxtl5KnvdOZLRHm6zwe8mQjp1dBUkNSFMQ_tWv2DptcuvStQ0";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET, 
  privateKeyProvider,
});

interface HeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: number;
  type: string;
  message: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        if (web3auth.connected) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem("userEmail", user.email);
            await createUser(user.email, user.name || "Anonymous User");
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo?.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotifications(unreadNotifications);
        }
      }
    };

    fetchNotifications();

    const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(notificationInterval);
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!userInfo?.email) return;

      try {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const userBalance = await getUserBalance(user.id);
          setBalance(typeof userBalance === "number" ? userBalance : 0);
        }
      } catch (error) {
        console.error("Error fetching user balance:", error);
      }
    };

    fetchUserBalance();
  }, [userInfo]);

  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setLoggedIn(true);
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem("userEmail", user.email);
        await createUser(user.email, user.name || "Anonymous User");
      }
      console.log(web3authProvider);
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem("userEmail");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center">Loading Web3Auth...</div>;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
            <span className="font-bold text-base md:text-lg text-gray-800">Cleanify</span>
          </Link>
        </div>

        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2">
              <Search className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
            <span className="font-semibold text-sm md:text-base text-gray-800">{balance.toFixed(2)}</span>
          </div>

          {!loggedIn ? (
            <Button
              onClick={login}
              className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base"
            >
              Login
              <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{userInfo ? userInfo.name : "User Info"}</DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
