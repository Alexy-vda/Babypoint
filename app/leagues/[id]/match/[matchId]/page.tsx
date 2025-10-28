/**
 * Page Match Detail - React Server Component
 * Données initiales en RSC, streaming SSE via composant client
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchLiveUpdates } from "@/components/match/match-live-updates";
import { prisma } from "@/lib/prisma";

interface MatchPageProps {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}

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

async function fetchMatchData(matchId: string): Promise<MatchData | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return null;
    }

    return {
      id: match.id,
      status: match.status as "IN_PROGRESS" | "FINISHED" | "CANCELLED",
      type: match.type as "ONE_V_ONE" | "TWO_V_TWO",
      scoreTeamA: match.scoreTeamA,
      scoreTeamB: match.scoreTeamB,
      startedAt: match.startedAt.toISOString(),
      finishedAt: match.finishedAt?.toISOString() || null,
      players: match.players.map(
        (p: {
          userId: string;
          team: string;
          user: {
            id: string;
            username: string;
            displayName: string | null;
          };
        }) => ({
          userId: p.userId,
          team: p.team as "TEAM_A" | "TEAM_B",
          user: {
            id: p.user.id,
            username: p.user.username,
            displayName: p.user.displayName,
            avatar: null,
          },
        })
      ) as MatchPlayer[],
    };
  } catch (error) {
    console.error("Erreur lors du chargement du match:", error);
    return null;
  }
}

export default async function MatchPage({ params }: MatchPageProps) {
  const resolvedParams = await params;
  const { id: leagueId, matchId } = resolvedParams;

  const match = await fetchMatchData(matchId);

  if (!match) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-slate-500/50"
        >
          <Link href={`/leagues/${leagueId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>
      <div className="flex-1 flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold text-white">
          Match {match.type === "ONE_V_ONE" ? "1v1" : "2v2"}
        </h1>
        <p className="text-slate-400 mt-1">
          {new Date(match.startedAt).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <MatchLiveUpdates initialMatch={match} matchId={matchId} />
      </div>

      {/* Informations du match */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">État</span>
              <span
                className={`font-semibold ${
                  match.status === "IN_PROGRESS"
                    ? "text-green-400"
                    : match.status === "FINISHED"
                    ? "text-blue-400"
                    : "text-slate-400"
                }`}
              >
                {match.status === "IN_PROGRESS"
                  ? "En cours"
                  : match.status === "FINISHED"
                  ? "Terminé"
                  : "Annulé"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Début</span>
              <span className="text-white">
                {new Date(match.startedAt).toLocaleTimeString("fr-FR")}
              </span>
            </div>
            {match.finishedAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Fin</span>
                <span className="text-white">
                  {new Date(match.finishedAt).toLocaleTimeString("fr-FR")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Détails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Format</span>
              <span className="text-white">
                {match.type === "ONE_V_ONE" ? "1 contre 1" : "2 contre 2"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Joueurs</span>
              <span className="text-white">{match.players.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total buts</span>
              <span className="text-white">
                {match.scoreTeamA + match.scoreTeamB}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton retour */}
      <div className="flex justify-center">
        <Button
          asChild
          variant="outline"
          className="border-slate-600 text-slate-300"
        >
          <Link href={`/leagues/${leagueId}`}>Retour à la ligue</Link>
        </Button>
      </div>
    </div>
  );
}
