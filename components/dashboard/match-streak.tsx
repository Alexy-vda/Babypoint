"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface MatchStreakProps {
  results: ("W" | "L")[]; // W = Win, L = Loss
  maxDisplay?: number;
}

export function MatchStreak({ results, maxDisplay = 20 }: MatchStreakProps) {
  // Prendre seulement les derniers matchs selon maxDisplay
  const displayedResults = results.slice(-maxDisplay);

  // Détecter les séries de victoires consécutives
  const getStreak = (index: number): number => {
    let streak = 0;
    for (let i = index; i >= 0; i--) {
      if (displayedResults[i] === "W") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  console.log("Displayed Results:", displayedResults);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Historique des matchs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-start gap-1 overflow-hidden">
          {displayedResults.map((result, index) => {
            const streak = getStreak(index);
            const isOnStreak = result === "W" && streak >= 3;

            return (
              <div
                key={index}
                className="relative group"
                title={`Match ${index + 1}: ${
                  result === "W" ? "Victoire" : "Défaite"
                }${isOnStreak ? ` (Série de ${streak})` : ""}`}
              >
                {isOnStreak ? (
                  // Flamme pour série de 3+ victoires
                  <div className="relative">
                    <Flame
                      className="h-6 w-6 text-orange-500 fill-orange-500/20"
                      strokeWidth={1.5}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        V
                      </span>
                    </div>
                  </div>
                ) : (
                  // Rond normal pour victoire ou défaite
                  <div
                    className={`
                      h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${
                        result === "W"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }
                      transition-transform hover:scale-125
                    `}
                  >
                    {result}
                  </div>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {result === "W" ? "Victoire" : "Défaite"}
                  {isOnStreak && ` (🔥 ${streak})`}
                </div>
              </div>
            );
          })}
        </div>

        {displayedResults.length === 0 && (
          <p className="text-slate-400 text-center py-4">Aucun match récent</p>
        )}
      </CardContent>
    </Card>
  );
}
