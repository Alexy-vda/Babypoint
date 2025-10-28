/**
 * Page League - React Server Component
 * Fetch async des données, extraction des parties interactives vers client components
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from "@/components/league/leaderboard";
import { MatchHistory } from "@/components/league/match-history";
import { LeagueActions } from "@/components/league/league-actions";
import { LeagueInfo } from "@/components/league/league-info";
import { getUserFromCookies } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

interface LeaguePageProps {
  params: Promise<{
    id: string;
  }>;
}

interface LeagueData {
  league: {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
    createdAt: string;
    ownerId: string;
    _count: {
      memberships: number;
      matches: number;
    };
  };
  leaderboard: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    rating: number;
    matchesWon: number;
    matchesLost: number;
    totalMatches: number;
    winRate: number | string;
  }>;
  matches: Array<{
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
  }>;
}

async function fetchLeagueData(
  leagueId: string,
  userId: string
): Promise<LeagueData> {
  // Récupérer la ligue
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      _count: {
        select: {
          memberships: true,
          matches: true,
        },
      },
    },
  });

  if (!league) {
    notFound();
  }

  // Vérifier que l'utilisateur est membre de cette ligue
  const membership = await prisma.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId,
        leagueId,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  // Récupérer le leaderboard
  const eloRatings = await prisma.eloRating.findMany({
    where: { leagueId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: { rating: "desc" },
  });

  // Calculer les stats pour chaque joueur
  const leaderboard = await Promise.all(
    eloRatings.map(
      async (elo: {
        userId: string;
        rating: number;
        user: {
          id: string;
          username: string;
          displayName: string | null;
        };
      }) => {
        const matchPlayers = await prisma.matchPlayer.findMany({
          where: {
            userId: elo.userId,
            match: {
              leagueId,
              status: "FINISHED",
            },
          },
          include: {
            match: {
              select: {
                scoreTeamA: true,
                scoreTeamB: true,
              },
            },
          },
        });

        let wins = 0;
        let losses = 0;

        matchPlayers.forEach(
          (mp: {
            team: string;
            match: {
              scoreTeamA: number;
              scoreTeamB: number;
            };
          }) => {
            const teamAWon = mp.match.scoreTeamA > mp.match.scoreTeamB;
            const won =
              (mp.team === "TEAM_A" && teamAWon) ||
              (mp.team === "TEAM_B" && !teamAWon);
            if (won) wins++;
            else losses++;
          }
        );

        const totalMatches = wins + losses;
        const winRate =
          totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";

        return {
          userId: elo.user.id,
          username: elo.user.username,
          displayName: elo.user.displayName,
          avatar: null,
          rating: elo.rating,
          matchesWon: wins,
          matchesLost: losses,
          totalMatches,
          winRate,
        };
      }
    )
  );

  // Récupérer les matchs récents
  const matches = await prisma.match.findMany({
    where: { leagueId },
    include: {
      players: {
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return {
    league: {
      id: league.id,
      name: league.name,
      description: league.description,
      inviteCode: league.inviteCode,
      createdAt: league.createdAt.toISOString(),
      ownerId: league.ownerId,
      _count: league._count,
    },
    leaderboard,
    matches: matches.map(
      (match: {
        id: string;
        type: "ONE_V_ONE" | "TWO_V_TWO";
        status: "IN_PROGRESS" | "FINISHED" | "CANCELLED";
        scoreTeamA: number;
        scoreTeamB: number;
        startedAt: Date;
        finishedAt: Date | null;
        players: Array<{
          userId: string;
          team: string;
          user: {
            username: string;
            displayName: string | null;
          };
        }>;
      }) => ({
        id: match.id,
        type: match.type,
        status: match.status,
        scoreTeamA: match.scoreTeamA,
        scoreTeamB: match.scoreTeamB,
        startedAt: match.startedAt.toISOString(),
        finishedAt: match.finishedAt?.toISOString() || null,
        players: match.players.map(
          (p: {
            userId: string;
            team: string;
            user: {
              username: string;
              displayName: string | null;
            };
          }) => ({
            userId: p.userId,
            team: p.team as "TEAM_A" | "TEAM_B",
            user: {
              username: p.user.username,
              displayName: p.user.displayName,
            },
          })
        ),
      })
    ),
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const user = await getUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const leagueId = resolvedParams.id;

  const data = await fetchLeagueData(leagueId, user.userId);

  const isOwner = data.league.ownerId === user.userId;
  const inviteUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/leagues/join?code=${data.league.inviteCode}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-500/50 shrink-0"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white truncate">
              {data.league.name}
            </h1>
            {data.league.description && (
              <p className="text-slate-400 mt-1">{data.league.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {data.league._count.memberships} membres
              </span>
              <span>•</span>
              <span>{data.league._count.matches} matchs</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LeagueActions
            leagueId={leagueId}
            inviteCode={data.league.inviteCode}
            isOwner={isOwner}
          />

          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/leagues/${leagueId}/match/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau match
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
          <TabsTrigger value="matches">Matchs</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Leaderboard entries={data.leaderboard} currentUserId={user.userId} />
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <MatchHistory matches={data.matches} leagueId={leagueId} />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <LeagueInfo
            inviteCode={data.league.inviteCode}
            inviteUrl={inviteUrl}
            createdAt={data.league.createdAt}
            membersCount={data.league._count.memberships}
            matchesCount={data.league._count.matches}
            isOwner={isOwner}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
