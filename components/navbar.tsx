"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface NavbarProps {
  user: {
    userId: string;
    email: string;
    username: string;
    displayName?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const displayName = user.displayName || user.username;

  return (
    <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">BabyPoint</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
