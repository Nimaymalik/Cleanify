import Link from "next/link";
import { MapPin, Trash, Coins, Medal, Settings, Home } from "lucide-react";
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
}

export default function SideBar({ onMenuClick }: SidebarProps) {
  const pathname = usePathname();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(isLargeScreen);

  useEffect(() => {
    if (isLargeScreen) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLargeScreen]);

  const handleMenuClick = () => {
    setOpen(!open);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <>
      {/* Menu Button */}
      {!isLargeScreen && (
        <button
          onClick={handleMenuClick}
          className="fixed top-4 left-4 z-40 bg-green-600 text-white p-2 rounded-md focus:outline-none"
        >
          {open ? "Close Menu" : "Open Menu"}
        </button>
      )}

      <aside
        className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="h-full flex flex-col justify-between">
          <div className="px-4 py-6 space-y-8">
            {sidebarItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={`w-full justify-start py-3 ${
                    pathname === item.href
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="text-base">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <Link href="/settings" passHref>
              <Button
                variant={pathname === "/settings" ? "secondary" : "outline"}
                className={`w-full py-3 ${
                  pathname === "/settings"
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                <span className="text-base"> Settings</span>
              </Button>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
