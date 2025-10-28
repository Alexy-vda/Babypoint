import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { createLeagueSchema } from "@/lib/validations";
import { z } from "zod";
import { nanoid } from "nanoid";

// GET /api/leagues - Récupérer toutes les ligues de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const leagues = await prisma.league.findMany({
      where: {
        memberships: {
          some: {
            userId: user.userId,
          },
        },
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error("Erreur lors de la récupération des ligues:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/leagues - Créer une nouvelle ligue
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createLeagueSchema.parse(body);

    // Créer la ligue avec un code d'invitation unique
    const league = await prisma.league.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        inviteCode: nanoid(10),
        ownerId: user.userId,
        memberships: {
          create: {
            userId: user.userId,
            role: "owner",
          },
        },
      },
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

    // Créer un rating Elo initial pour le créateur de la ligue
    await prisma.eloRating.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        rating: 1000,
      },
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de la ligue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
