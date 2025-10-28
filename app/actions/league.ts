"use server";

/**
 * Server Actions pour les ligues
 * Remplace les API routes pour les mutations des ligues
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "@/lib/auth-server";

export async function createLeague(formData: FormData) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isPublic = formData.get("isPublic") === "true";

  if (!name || name.trim().length === 0) {
    return { error: "Le nom est requis" };
  }

  try {
    const league = await prisma.league.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic,
        ownerId: user.userId,
        memberships: {
          create: {
            userId: user.userId,
            role: "owner",
          },
        },
      },
    });

    // Créer l'EloRating initial pour le créateur
    await prisma.eloRating.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        rating: 1000,
      },
    });

    revalidatePath("/dashboard");

    return { success: true, leagueId: league.id };
  } catch (error) {
    console.error("Erreur création ligue:", error);
    return { error: "Erreur lors de la création de la ligue" };
  }
}

export async function joinLeague(inviteCode: string) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  if (!inviteCode) {
    return { error: "Code d'invitation requis" };
  }

  try {
    const league = await prisma.league.findUnique({
      where: { inviteCode },
      include: { memberships: true },
    });

    if (!league) {
      return { error: "Code d'invitation invalide" };
    }

    // Vérifier si déjà membre
    const existingMembership = league.memberships.find(
      (m: { userId: string }) => m.userId === user.userId
    );

    if (existingMembership) {
      return { error: "Vous êtes déjà membre de cette ligue" };
    }

    // Créer l'adhésion
    await prisma.leagueMembership.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        role: "member",
      },
    });

    // Créer l'EloRating initial
    await prisma.eloRating.create({
      data: {
        userId: user.userId,
        leagueId: league.id,
        rating: 1000,
      },
    });

    revalidatePath("/dashboard");

    return { success: true, leagueId: league.id };
  } catch (error) {
    console.error("Erreur rejoindre ligue:", error);
    return { error: "Erreur lors de l'adhésion à la ligue" };
  }
}

export async function leaveLeague(leagueId: string) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return { error: "Ligue non trouvée" };
    }

    if (league.ownerId === user.userId) {
      return { error: "Le propriétaire ne peut pas quitter la ligue" };
    }

    // Supprimer l'adhésion et le rating
    await prisma.$transaction([
      prisma.eloRating.delete({
        where: {
          userId_leagueId: {
            userId: user.userId,
            leagueId,
          },
        },
      }),
      prisma.leagueMembership.delete({
        where: {
          userId_leagueId: {
            userId: user.userId,
            leagueId,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/leagues/${leagueId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur quitter ligue:", error);
    return { error: "Erreur lors de la sortie de la ligue" };
  }
}

export async function deleteLeague(leagueId: string) {
  const user = await getUserFromCookies();

  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return { error: "Ligue non trouvée" };
    }

    if (league.ownerId !== user.userId) {
      return { error: "Seul le propriétaire peut supprimer la ligue" };
    }

    // Prisma cascade supprimera automatiquement:
    // - LeagueMembership
    // - Match (et leurs MatchPlayer via cascade)
    // - EloRating (et leurs EloChange via cascade)
    await prisma.league.delete({
      where: { id: leagueId },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression ligue:", error);
    return { error: "Erreur lors de la suppression de la ligue" };
  }
}
