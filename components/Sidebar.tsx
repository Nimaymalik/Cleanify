"use client";
import Link from "next/link";
import {
  MapPin,
  Trash,
  Coins,
  Medal,
  Settings,
  Home,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";

const sidebarItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/report", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
];

interface SidebarProps {
  onMenuClick?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function SideBar({ onMenuClick, open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isLargeScreen) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLargeScreen, setOpen]);

  const handleMenuClick = () => {
    setOpen(!open);
    if (onMenuClick) onMenuClick();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {open && !isLargeScreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20"
          onClick={handleMenuClick}
        />
      )}

      {/* Hamburger menu button (mobile) */}
      {!isLargeScreen && (
        <button
          onClick={handleMenuClick}
          className="fixed top-4 left-4 z-40 bg-green-600 text-white p-2 rounded-md focus:outline-none shadow-lg"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            // 3-line hamburger
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar-custom${open ? ' open' : ''}`}>
        <div className="flex flex-col justify-between h-full pt-20 lg:pt-16">
          {/* Navigation */}
          <nav className="px-4 py-6 space-y-4 lg:space-y-6">
            {sidebarItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={`w-full justify-start py-3 text-sm lg:text-base ${
                    pathname === item.href
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Settings */}
          <div className="p-4 border-t border-gray-200">
            <Link href="/settings" passHref>
              <Button
                variant={pathname === "/settings" ? "secondary" : "outline"}
                className={`w-full py-3 text-sm lg:text-base ${
                  pathname === "/settings"
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
