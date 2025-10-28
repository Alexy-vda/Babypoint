import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { finishMatchSchema } from "@/lib/validations";
import { calculate1v1Ratings, calculate2v2Ratings } from "@/lib/elo";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/matches/[id]/finish - Terminer un match et calculer les Elo
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = finishMatchSchema.parse(body);

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: true,
          },
          orderBy: [{ team: "asc" }, { position: "asc" }],
        },
        league: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    if (match.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Ce match est déjà terminé" },
        { status: 400 }
      );
    }

    const teamAWon = validatedData.scoreTeamA > validatedData.scoreTeamB;

    // Séparer les joueurs par équipe
    const teamAPlayers = match.players.filter(
      (p: { team: string }) => p.team === "TEAM_A"
    );
    const teamBPlayers = match.players.filter(
      (p: { team: string }) => p.team === "TEAM_B"
    );

    // Récupérer les ratings Elo actuels
    const teamARatings = await prisma.eloRating.findMany({
      where: {
        leagueId: match.leagueId,
        userId: { in: teamAPlayers.map((p: { userId: string }) => p.userId) },
      },
    });

    const teamBRatings = await prisma.eloRating.findMany({
      where: {
        leagueId: match.leagueId,
        userId: { in: teamBPlayers.map((p: { userId: string }) => p.userId) },
      },
    });

    // Calculer les nouveaux ratings selon le type de match
    let newRatingsA: number[];
    let newRatingsB: number[];
    let changesA: number[];
    let changesB: number[];

    if (match.type === "ONE_V_ONE") {
      const result = calculate1v1Ratings(
        teamARatings[0].rating,
        teamBRatings[0].rating,
        teamAWon
      );
      newRatingsA = [result.newRatingA];
      newRatingsB = [result.newRatingB];
      changesA = [result.changeA];
      changesB = [result.changeB];
    } else {
      // 2v2
      const result = calculate2v2Ratings(
        teamARatings.map((r: { rating: number }) => r.rating),
        teamBRatings.map((r: { rating: number }) => r.rating),
        teamAWon
      );
      newRatingsA = result.newRatingsTeamA;
      newRatingsB = result.newRatingsTeamB;
      changesA = result.changesTeamA;
      changesB = result.changesTeamB;
    }

    // Mettre à jour les ratings et créer l'historique
    await prisma.$transaction(
      async (
        tx: Omit<
          typeof prisma,
          "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
        >
      ) => {
        // Mettre à jour le match
        await tx.match.update({
          where: { id },
          data: {
            status: "FINISHED",
            scoreTeamA: validatedData.scoreTeamA,
            scoreTeamB: validatedData.scoreTeamB,
            finishedAt: new Date(),
          },
        });

        // Mettre à jour les ratings de l'équipe A
        for (let i = 0; i < teamARatings.length; i++) {
          const rating = teamARatings[i];
          const newWinStreak = teamAWon ? rating.winStreak + 1 : 0;

          await tx.eloRating.update({
            where: { id: rating.id },
            data: {
              rating: newRatingsA[i],
              matchesWon: teamAWon ? rating.matchesWon + 1 : rating.matchesWon,
              matchesLost: !teamAWon
                ? rating.matchesLost + 1
                : rating.matchesLost,
              winStreak: newWinStreak,
              bestStreak: Math.max(rating.bestStreak, newWinStreak),
            },
          });

          // Créer l'historique
          await tx.eloChange.create({
            data: {
              eloRatingId: rating.id,
              matchId: id,
              ratingBefore: rating.rating,
              ratingAfter: newRatingsA[i],
              change: changesA[i],
            },
          });
        }

        // Mettre à jour les ratings de l'équipe B
        for (let i = 0; i < teamBRatings.length; i++) {
          const rating = teamBRatings[i];
          const newWinStreak = !teamAWon ? rating.winStreak + 1 : 0;

          await tx.eloRating.update({
            where: { id: rating.id },
            data: {
              rating: newRatingsB[i],
              matchesWon: !teamAWon ? rating.matchesWon + 1 : rating.matchesWon,
              matchesLost: teamAWon
                ? rating.matchesLost + 1
                : rating.matchesLost,
              winStreak: newWinStreak,
              bestStreak: Math.max(rating.bestStreak, newWinStreak),
            },
          });

          // Créer l'historique
          await tx.eloChange.create({
            data: {
              eloRatingId: rating.id,
              matchId: id,
              ratingBefore: rating.rating,
              ratingAfter: newRatingsB[i],
              change: changesB[i],
            },
          });
        }
      }
    );

    // Récupérer le match mis à jour
    const updatedMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        eloChanges: {
          include: {
            eloRating: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Match terminé avec succès",
      match: updatedMatch,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la fin du match:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
