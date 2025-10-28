"use client";

import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, getRatingColor } from "@/lib/utils";

interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  rating: number;
  wins?: number;
  losses?: number;
  matchesWon?: number;
  matchesLost?: number;
  totalMatches: number;
  winRate: number | string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400 text-center">
            Aucun joueur dans le classement
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Classement Elo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const position = index + 1;
            const displayName = entry.displayName || entry.username;

            // Icône de tendance (pour l'instant statique, pourrait être dynamique)
            const TrendIcon =
              position <= 3
                ? TrendingUp
                : position > entries.length - 3
                ? TrendingDown
                : Minus;

            return (
              <Link
                key={entry.userId}
                href={`/players/${entry.userId}`}
                className={`flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors ${
                  isCurrentUser ? "bg-blue-500/10" : ""
                }`}
              >
                {/* Position */}
                <div className="w-8 text-center">
                  {position <= 3 ? (
                    <span className="text-2xl">
                      {position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">
                      #{position}
                    </span>
                  )}
                </div>

                {/* Avatar + Nom */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 bg-blue-600">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        isCurrentUser ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {displayName}
                      {isCurrentUser && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-blue-500 text-blue-400"
                        >
                          Vous
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-slate-400">
                      {entry.totalMatches} matchs •{" "}
                      {typeof entry.winRate === "number"
                        ? entry.winRate.toFixed(0)
                        : parseFloat(entry.winRate).toFixed(0)}
                      % victoires
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Ratio</p>
                    <p className="text-sm font-medium text-white">
                      {entry.wins ?? entry.matchesWon ?? 0}W -{" "}
                      {entry.losses ?? entry.matchesLost ?? 0}L
                    </p>
                  </div>
                  {entry.totalMatches > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Tendance</p>
                      <TrendIcon
                        className={`h-4 w-4 ${
                          position <= 3
                            ? "text-green-500"
                            : position > entries.length - 3
                            ? "text-red-500"
                            : "text-slate-500"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Rating Elo */}
                <div className="text-right">
                  <p className="text-xs text-slate-400">Elo</p>
                  <p
                    className={`text-lg font-bold ${getRatingColor(
                      entry.rating
                    )}`}
                  >
                    {entry.rating}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
