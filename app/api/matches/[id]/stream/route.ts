import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";
import { POLLING_INTERVALS } from "@/lib/constants";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/matches/[id]/stream - Stream SSE des événements du match
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return new Response("Non authentifié", { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le match existe
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        league: true,
      },
    });

    if (!match) {
      return new Response("Match non trouvé", { status: 404 });
    }

    // Vérifier que l'utilisateur est membre de la ligue
    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: user.userId,
          leagueId: match.leagueId,
        },
      },
    });

    if (!membership) {
      return new Response("Accès refusé", { status: 403 });
    }

    // Créer un stream SSE
    const encoder = new TextEncoder();
    let intervalId: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Fonction pour envoyer les données du match
        const sendMatchData = async () => {
          try {
            const currentMatch = await prisma.match.findUnique({
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
                  orderBy: {
                    team: "asc",
                  },
                },
              },
            });

            if (!currentMatch) {
              controller.close();
              if (intervalId) clearInterval(intervalId);
              return;
            }

            const data = {
              id: currentMatch.id,
              status: currentMatch.status,
              type: currentMatch.type,
              scoreTeamA: currentMatch.scoreTeamA,
              scoreTeamB: currentMatch.scoreTeamB,
              startedAt: currentMatch.startedAt,
              finishedAt: currentMatch.finishedAt,
              players: currentMatch.players,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );

            // Si le match est terminé, fermer le stream
            if (
              currentMatch.status === "FINISHED" ||
              currentMatch.status === "CANCELLED"
            ) {
              controller.close();
              if (intervalId) clearInterval(intervalId);
            }
          } catch (error) {
            console.error("Erreur lors de l'envoi des données:", error);
            controller.error(error);
            if (intervalId) clearInterval(intervalId);
          }
        };

        // Envoyer les données initiales
        await sendMatchData();

        // Vérifier si le match est toujours en cours avant de commencer le polling
        const currentMatch = await prisma.match.findUnique({
          where: { id },
          select: { status: true },
        });

        if (currentMatch?.status === "IN_PROGRESS") {
          // Polling optimisé - 5s au lieu de 1s
          // Justification: Réduit la charge DB de 80% tout en maintenant
          // une expérience temps réel acceptable pour un match de babyfoot
          intervalId = setInterval(sendMatchData, POLLING_INTERVALS.MATCH_LIVE);
        }
      },
      cancel() {
        if (intervalId) clearInterval(intervalId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erreur SSE:", error);
    return new Response("Erreur interne", { status: 500 });
  }
}
