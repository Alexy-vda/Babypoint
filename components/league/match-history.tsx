"use client";

import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface Match {
  id: string;
  type: "ONE_V_ONE" | "TWO_V_TWO";
  status: "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: string;
  finishedAt: string | null;
  players: {
    userId: string;
    team: "TEAM_A" | "TEAM_B";
    user: {
      username: string;
      displayName: string | null;
    };
  }[];
}

interface MatchHistoryProps {
  matches: Match[];
  leagueId?: string;
  limit?: number;
}

export function MatchHistory({ matches, leagueId, limit }: MatchHistoryProps) {
  const displayedMatches = limit ? matches.slice(0, limit) : matches;

  if (displayedMatches.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400 text-center">
            Aucun match joué pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Historique des matchs
          {limit && matches.length > limit && (
            <span className="text-sm text-slate-400 font-normal ml-auto">
              {limit} derniers matchs sur {matches.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700">
          {displayedMatches.map((match) => {
            const teamA = match.players.filter((p) => p.team === "TEAM_A");
            const teamB = match.players.filter((p) => p.team === "TEAM_B");
            const teamAWon = match.scoreTeamA > match.scoreTeamB;
            const isFinished = match.status === "FINISHED";

            return (
              <Link
                key={match.id}
                href={
                  leagueId
                    ? `/leagues/${leagueId}/match/${match.id}`
                    : `/matches/${match.id}`
                }
                className="block p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Teams */}
                  <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Team A */}
                    <div
                      className={`text-right ${
                        teamAWon && isFinished ? "text-green-400" : "text-white"
                      }`}
                    >
                      <p className="font-medium">
                        {teamA
                          .map((p) => p.user.displayName || p.user.username)
                          .join(" & ")}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-bold ${
                          teamAWon && isFinished
                            ? "text-green-400"
                            : "text-white"
                        }`}
                      >
                        {match.scoreTeamA}
                      </span>
                      <span className="text-slate-500">-</span>
                      <span
                        className={`text-2xl font-bold ${
                          !teamAWon && isFinished
                            ? "text-green-400"
                            : "text-white"
                        }`}
                      >
                        {match.scoreTeamB}
                      </span>
                    </div>

                    {/* Team B */}
                    <div
                      className={`text-left ${
                        !teamAWon && isFinished
                          ? "text-green-400"
                          : "text-white"
                      }`}
                    >
                      <p className="font-medium">
                        {teamB
                          .map((p) => p.user.displayName || p.user.username)
                          .join(" & ")}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        match.status === "FINISHED" ? "default" : "secondary"
                      }
                      className={
                        match.status === "FINISHED"
                          ? "bg-green-600"
                          : match.status === "CANCELLED"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                      }
                    >
                      {match.status === "FINISHED"
                        ? "Terminé"
                        : match.status === "CANCELLED"
                        ? "Annulé"
                        : "En cours"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {match.type === "ONE_V_ONE" ? "1v1" : "2v2"}
                    </Badge>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-slate-400 mt-2">
                  {formatDateTime(match.finishedAt || match.startedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
