/**
 * Page Statistiques Joueur - En construction
 */

import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerStatsPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function PlayerStatsPage({
  params,
}: PlayerStatsPageProps) {
  const resolvedParams = await params;
  const { userId } = resolvedParams;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-slate-500/50"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Statistiques du joueur
          </h1>
          <p className="text-slate-400 mt-1">
            Analyse détaillée des performances
          </p>
        </div>
      </div>

      {/* Contenu "En construction" */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-8">
            {/* Icônes décoratives */}
            <div className="absolute -top-4 -left-4 text-slate-700">
              <BarChart3 className="h-12 w-12 opacity-30" />
            </div>
            <div className="absolute -top-4 -right-4 text-slate-700">
              <TrendingUp className="h-12 w-12 opacity-30" />
            </div>
            <div className="absolute -bottom-4 -left-4 text-slate-700">
              <Users className="h-12 w-12 opacity-30" />
            </div>
            <div className="absolute -bottom-4 -right-4 text-slate-700">
              <Trophy className="h-12 w-12 opacity-30" />
            </div>

            {/* Icône principale */}
            <div className="bg-blue-500/10 p-8 rounded-full border-2 border-blue-500/20">
              <BarChart3 className="h-20 w-20 text-blue-500" />
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-bold text-white">
              Page en construction 🚧
            </h2>
            <p className="text-slate-400 text-lg">
              Les statistiques détaillées des joueurs seront bientôt disponibles
              !
            </p>

            <div className="pt-6 space-y-2">
              <p className="text-sm text-slate-500 font-medium">
                Fonctionnalités à venir :
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>📊 Graphiques d&apos;évolution du Elo</li>
                <li>🎯 Statistiques par type de match (1v1, 2v2)</li>
                <li>🤝 Analyse des partenaires et adversaires</li>
                <li>📈 Historique détaillé des performances</li>
                <li>🏆 Palmarès et réalisations</li>
              </ul>
            </div>

            <div className="pt-6 flex gap-3 justify-center">
              <Button
                asChild
                variant="outline"
                className="border-slate-600 text-slate-300 bg-slate-800"
              >
                <Link href="javascript:history.back()">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>

              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard">Voir mon dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note technique */}
      <div className="text-center text-xs text-slate-500">
        <p>User ID: {userId}</p>
        <p className="mt-1">
          Cette page affichera les statistiques complètes une fois développée
        </p>
      </div>
    </div>
  );
}
