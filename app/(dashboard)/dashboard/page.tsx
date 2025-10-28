/**
 * Page Dashboard - React Server Component
 * Affiche les statistiques de l'utilisateur dans sa ligue active
 */

import Link from "next/link";
import {
  Trophy,
  Medal,
  Flame,
  Users2,
  TrendingUp,
  TrendingDown,
  Plus,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { MatchStreak } from "@/components/dashboard/match-streak";
import { getUserFromCookies } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface DashboardStats {
  leagueName: string;
  leagueId: string;
  rating: number;
  position: number;
  totalPlayers: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  currentStreak: {
    count: number;
    type: "W" | "L" | null;
  };
  matchHistory: ("W" | "L")[];
  bestTeammate: {
    userId: string;
    name: string;
    matches: number;
    winRate: number;
  } | null;
}

async function fetchDashboardStats(
  userId: string
): Promise<DashboardStats | null> {
  try {
    // Récupérer toutes les ligues de l'utilisateur
    const memberships = await prisma.leagueMembership.findMany({
      where: { userId },
      include: {
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (memberships.length === 0) {
      return null;
    }

    // Prendre la première ligue (ou celle qui a le plus d'activité)
    const primaryLeagueId = memberships[0].league.id;

    // Récupérer le rating Elo
    const eloRating = await prisma.eloRating.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId: primaryLeagueId,
        },
      },
    });

    // Récupérer le classement de la ligue
    const leaderboard = await prisma.eloRating.findMany({
      where: { leagueId: primaryLeagueId },
      orderBy: { rating: "desc" },
      select: {
        userId: true,
        rating: true,
      },
    });

    // Trouver la position de l'utilisateur
    const userPosition =
      leaderboard.findIndex(
        (entry: { userId: string; rating: number }) => entry.userId === userId
      ) + 1;

    // Récupérer tous les matchs de l'utilisateur
    const allMatches = await prisma.matchPlayer.findMany({
      where: {
        userId,
        match: {
          leagueId: primaryLeagueId,
          status: "FINISHED",
        },
      },
      include: {
        match: {
          select: {
            id: true,
            scoreTeamA: true,
            scoreTeamB: true,
            finishedAt: true,
            players: {
              select: {
                userId: true,
                team: true,
              },
            },
          },
        },
      },
      orderBy: {
        match: {
          finishedAt: "desc",
        },
      },
      take: 30,
    });

    // Calculer wins/losses et la série
    let wins = 0;
    let losses = 0;
    const matchResults: ("W" | "L")[] = [];

    allMatches.forEach(
      (mp: {
        team: string;
        match: {
          scoreTeamA: number;
          scoreTeamB: number;
          players: { userId: string; team: string }[];
        };
      }) => {
        const teamAWon = mp.match.scoreTeamA > mp.match.scoreTeamB;
        const userWon =
          (mp.team === "TEAM_A" && teamAWon) ||
          (mp.team === "TEAM_B" && !teamAWon);

        if (userWon) {
          wins++;
          matchResults.push("W");
        } else {
          losses++;
          matchResults.push("L");
        }
      }
    );

    // Calculer la série actuelle
    let currentStreak = { count: 0, type: null as "W" | "L" | null };
    if (matchResults.length > 0) {
      const firstResult = matchResults[0];
      let count = 1;
      for (let i = 1; i < matchResults.length; i++) {
        if (matchResults[i] === firstResult) {
          count++;
        } else {
          break;
        }
      }
      currentStreak = { count, type: firstResult };
    }

    // Calculer le meilleur coéquipier
    const teammateStats = new Map<
      string,
      { name: string; wins: number; total: number }
    >();

    for (const mp of allMatches) {
      const teammates = mp.match.players.filter(
        (p: { userId: string; team: string }) =>
          p.userId !== userId && p.team === mp.team
      );

      const teamAWon = mp.match.scoreTeamA > mp.match.scoreTeamB;
      const userWon =
        (mp.team === "TEAM_A" && teamAWon) ||
        (mp.team === "TEAM_B" && !teamAWon);

      for (const teammate of teammates) {
        if (!teammateStats.has(teammate.userId)) {
          const user = await prisma.user.findUnique({
            where: { id: teammate.userId },
            select: { displayName: true, username: true },
          });
          teammateStats.set(teammate.userId, {
            name: user?.displayName || user?.username || "Inconnu",
            wins: 0,
            total: 0,
          });
        }
        const stats = teammateStats.get(teammate.userId)!;
        stats.total++;
        if (userWon) stats.wins++;
      }
    }

    let bestTeammate = null;
    let bestWinRate = 0;
    for (const [userId, stats] of teammateStats.entries()) {
      if (stats.total >= 3) {
        const winRate = (stats.wins / stats.total) * 100;
        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          bestTeammate = {
            userId,
            name: stats.name,
            matches: stats.total,
            winRate: Math.round(winRate),
          };
        }
      }
    }

    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      leagueName: memberships[0].league.name,
      leagueId: primaryLeagueId,
      rating: eloRating?.rating || 1000,
      position: userPosition,
      totalPlayers: leaderboard.length,
      wins,
      losses,
      totalMatches,
      winRate: Math.round(winRate),
      currentStreak,
      matchHistory: matchResults.slice(0, 10).reverse(), // Inverser pour avoir du plus ancien au plus récent
      bestTeammate,
    };
  } catch (error) {
    console.error("Erreur lors du chargement des stats:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  const stats = await fetchDashboardStats(user.userId);

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bienvenue, {user.displayName || user.username} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Rejoignez une ligue pour commencer à jouer
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-12">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Trophy className="h-16 w-16 text-slate-600" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Aucune ligue active
              </h3>
              <p className="text-slate-400 max-w-md">
                Vous n&apos;avez pas encore rejoint de ligue. Créez-en une
                nouvelle ou rejoignez une ligue existante pour commencer à
                jouer.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/leagues/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une ligue
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-600 text-slate-300 bg-slate-800"
              >
                <Link href="/leagues/join">
                  <QrCode className="h-4 w-4 mr-2" />
                  Rejoindre
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {stats.leagueName} - {user.displayName || user.username}
          </h1>
          <p className="text-slate-400 mt-1">
            Vos performances et statistiques
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href={`/leagues/${stats.leagueId}`}>Voir la ligue</Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard
          title="Position"
          value={`#${stats.position}`}
          description={`sur ${stats.totalPlayers} joueurs`}
          icon={Medal}
          iconColor="text-yellow-500"
        />

        <StatCard
          title="Rating Elo"
          value={stats.rating}
          description={
            stats.rating >= 1000 ? "Au-dessus de la moyenne" : "En progression"
          }
          icon={Trophy}
          iconColor="text-blue-500"
        />

        <StatCard
          title="Ratio Victoires"
          value={`${stats.winRate} %`}
          description={`${stats.wins}V - ${stats.losses}D`}
          icon={stats.winRate >= 50 ? TrendingUp : TrendingDown}
          iconColor={stats.winRate >= 50 ? "text-green-500" : "text-orange-500"}
        />

        {stats.currentStreak.type && stats.currentStreak.count > 0 && (
          <StatCard
            title="Série actuelle"
            value={`${stats.currentStreak.count} ${
              stats.currentStreak.type === "W" ? "victoires" : "défaites"
            }`}
            description={
              stats.currentStreak.type === "W"
                ? "Continue comme ça !"
                : "Prochain match sera le bon"
            }
            icon={Flame}
            iconColor={
              stats.currentStreak.type === "W"
                ? "text-orange-500"
                : "text-slate-500"
            }
          />
        )}

        {stats.bestTeammate && (
          <StatCard
            title="Meilleur coéquipier"
            value={stats.bestTeammate.name}
            description={`${stats.bestTeammate.matches} matchs - ${stats.bestTeammate.winRate}% victoires`}
            icon={Users2}
            iconColor="text-purple-500"
          />
        )}
      </div>

      {/* Match Streak Visualization */}
      {stats.matchHistory.length > 0 && (
        <MatchStreak results={stats.matchHistory} maxDisplay={25} />
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          asChild
          variant="outline"
          className="h-24 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-300"
        >
          <Link
            href={`/leagues/${stats.leagueId}/match/new`}
            className="flex flex-col items-center justify-center gap-2"
          >
            <Trophy className="h-6 w-6" />
            <span>Nouveau match</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-24 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-300"
        >
          <Link
            href={`/leagues/${stats.leagueId}`}
            className="flex flex-col items-center justify-center gap-2"
          >
            <Medal className="h-6 w-6" />
            <span>Voir le classement</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
