import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { joinLeagueSchema } from "@/lib/validations";
import { z } from "zod";

// POST /api/leagues/join - Rejoindre une ligue via code d'invitation
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = joinLeagueSchema.parse(body);

    // Trouver la ligue avec le code d'invitation
    const league = await prisma.league.findUnique({
      where: { inviteCode: validatedData.inviteCode },
    });

    if (!league) {
      return NextResponse.json(
        { error: "Code d'invitation invalide" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMembership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: league.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de cette ligue" },
        { status: 400 }
      );
    }

    // Créer l'appartenance
    await prisma.leagueMembership.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        role: "member",
      },
    });

    // Créer un rating Elo initial pour l'utilisateur dans cette ligue
    await prisma.eloRating.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        rating: 1000,
      },
    });

    const updatedLeague = await prisma.league.findUnique({
      where: { id: league.id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Vous avez rejoint la ligue avec succès",
      league: updatedLeague,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'adhésion à la ligue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
