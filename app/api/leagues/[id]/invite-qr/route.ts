import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/middleware";
import QRCode from "qrcode";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/leagues/[id]/invite-qr - Générer un QR code pour l'invitation
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const league = await prisma.league.findUnique({
      where: { id },
      select: {
        id: true,
        inviteCode: true,
        name: true,
        memberships: {
          where: { userId: user.userId },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: "Ligue non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est membre
    if (league.memberships.length === 0) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Créer l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/leagues/join?code=${league.inviteCode}`;

    // Générer le QR code
    const qrCode = await QRCode.toDataURL(inviteUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      qrCode,
      inviteUrl,
      inviteCode: league.inviteCode,
    });
  } catch (error) {
    console.error("Erreur lors de la génération du QR code:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
