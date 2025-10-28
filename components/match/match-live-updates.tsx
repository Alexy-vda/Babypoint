"use client";

/**
 * Composant client pour le streaming SSE des matchs en direct
 * Affiche le score mis à jour en temps réel via Server-Sent Events
 */

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MatchPlayer {
  userId: string;
  team: "TEAM_A" | "TEAM_B";
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

interface MatchData {
  id: string;
  status: "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  type: "ONE_V_ONE" | "TWO_V_TWO";
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: string;
  finishedAt: string | null;
  players: MatchPlayer[];
}

interface MatchLiveUpdatesProps {
  initialMatch: MatchData;
  matchId: string;
}

export function MatchLiveUpdates({
  initialMatch,
  matchId,
}: MatchLiveUpdatesProps) {
  const [match, setMatch] = useState<MatchData>(initialMatch);

  useEffect(() => {
    // Si le match n'est pas en cours, pas besoin de SSE
    if (match.status !== "IN_PROGRESS") {
      return;
    }

    // Établir la connexion SSE
    const eventSource = new EventSource(`/api/matches/${matchId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const matchData = JSON.parse(event.data);
        setMatch(matchData);

        // Si le match est terminé, fermer la connexion
        if (matchData.status === "FINISHED") {
          eventSource.close();
        }
      } catch (err) {
        console.error("Erreur parsing SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Erreur SSE:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [matchId, match.status]);

  const teamAPlayers = match.players.filter((p) => p.team === "TEAM_A");
  const teamBPlayers = match.players.filter((p) => p.team === "TEAM_B");
  const isLive = match.status === "IN_PROGRESS";
  const winnerTeam =
    match.status === "FINISHED"
      ? match.scoreTeamA > match.scoreTeamB
        ? "A"
        : "B"
      : null;

  return (
    <>
      {/* Badge Live */}
      {isLive && (
        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
          🔴 EN DIRECT
        </span>
      )}

      {/* Score Principal avec updates en temps réel */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div className="grid grid-cols-3 gap-6 items-center">
            {/* Équipe A */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Trophy
                  className={`h-6 w-6 ${
                    winnerTeam === "A" ? "text-yellow-500" : "text-blue-400"
                  }`}
                />
                <h3 className="text-xl font-bold text-white">Équipe A</h3>
              </div>
              <div className="space-y-1">
                {teamAPlayers.map((p) => (
                  <div
                    key={p.userId}
                    className="text-slate-300 flex items-center justify-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
                      {(p.user.displayName || p.user.username)
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <span>{p.user.displayName || p.user.username}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-7xl font-black text-white">
                {match.scoreTeamA} - {match.scoreTeamB}
              </div>
              {match.status === "FINISHED" && winnerTeam && (
                <p className="text-green-400 font-semibold mt-2">
                  Équipe {winnerTeam} gagne !
                </p>
              )}
            </div>

            {/* Équipe B */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Trophy
                  className={`h-6 w-6 ${
                    winnerTeam === "B" ? "text-yellow-500" : "text-red-400"
                  }`}
                />
                <h3 className="text-xl font-bold text-white">Équipe B</h3>
              </div>
              <div className="space-y-1">
                {teamBPlayers.map((p) => (
                  <div
                    key={p.userId}
                    className="text-slate-300 flex items-center justify-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold">
                      {(p.user.displayName || p.user.username)
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <span>{p.user.displayName || p.user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
