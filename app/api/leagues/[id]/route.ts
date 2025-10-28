import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/leagues/[id] - Récupérer une ligue spécifique
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        memberships: {
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
            joinedAt: "asc",
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: "Ligue non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est membre de la ligue
    const isMember = league.memberships.some(
      (m: { userId: string }) => m.userId === user.userId
    );

    if (!isMember && !league.isPublic) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ league });
  } catch (error) {
    console.error("Erreur lors de la récupération de la ligue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/leagues/[id] - Supprimer une ligue
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const league = await prisma.league.findUnique({
      where: { id },
    });

    if (!league) {
      return NextResponse.json({ error: "Ligue non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (league.ownerId !== user.userId) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut supprimer la ligue" },
        { status: 403 }
      );
    }

    await prisma.league.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Ligue supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la ligue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
