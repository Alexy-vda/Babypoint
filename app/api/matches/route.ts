import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { createMatchSchema } from "@/lib/validations";
import { z } from "zod";

// GET /api/matches - Récupérer les matchs d'une ligue
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!leagueId) {
      return NextResponse.json({ error: "leagueId requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const matches = await prisma.match.findMany({
      where: {
        leagueId,
        ...(status && {
          status: status as "IN_PROGRESS" | "FINISHED" | "CANCELLED",
        }),
      },
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
          orderBy: {
            team: "asc",
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/matches - Créer un nouveau match
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createMatchSchema.parse(body);

    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: validatedData.leagueId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que tous les joueurs sont membres de la ligue
    const allPlayerIds = [...validatedData.teamA, ...validatedData.teamB];
    const playerMemberships = await prisma.leagueMembership.findMany({
      where: {
        leagueId: validatedData.leagueId,
        userId: { in: allPlayerIds },
      },
    });

    if (playerMemberships.length !== allPlayerIds.length) {
      return NextResponse.json(
        { error: "Tous les joueurs doivent être membres de la ligue" },
        { status: 400 }
      );
    }

    // Créer le match
    const match = await prisma.match.create({
      data: {
        leagueId: validatedData.leagueId,
        type: validatedData.type,
        status: "IN_PROGRESS",
        players: {
          create: [
            ...validatedData.teamA.map((userId, index) => ({
              userId,
              team: "TEAM_A",
              position: index,
            })),
            ...validatedData.teamB.map((userId, index) => ({
              userId,
              team: "TEAM_B",
              position: index,
            })),
          ],
        },
      },
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
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du match:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
