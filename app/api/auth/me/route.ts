import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les informations complètes de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        createdAt: true,
        memberships: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
