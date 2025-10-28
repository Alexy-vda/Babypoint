"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { POLLING_INTERVALS } from "@/lib/constants";

interface LeagueMember {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

interface MatchPlayer {
  userId: string;
  team: "TEAM_A" | "TEAM_B";
  user: {
    id: string;
    username: string;
    displayName: string | null;
  };
}

interface MatchData {
  id: string;
  status: string;
  type: "ONE_V_ONE" | "TWO_V_TWO";
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: string;
  players: MatchPlayer[];
}

interface LiveMatchProps {
  leagueId: string;
  members: LeagueMember[];
}

export function LiveMatch({ leagueId, members }: LiveMatchProps) {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(true);

  if (isSetup) {
    return (
      <LiveMatchSetup
        leagueId={leagueId}
        members={members}
        onMatchCreated={(id) => {
          setMatchId(id);
          setIsSetup(false);
        }}
      />
    );
  }

  return <LiveMatchPlay matchId={matchId!} leagueId={leagueId} />;
}

// Composant de configuration avant le match
function LiveMatchSetup({
  leagueId,
  members,
  onMatchCreated,
}: {
  leagueId: string;
  members: LeagueMember[];
  onMatchCreated: (matchId: string) => void;
}) {
  const [matchType, setMatchType] = useState<"ONE_V_ONE" | "TWO_V_TWO">(
    "ONE_V_ONE"
  );
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartMatch = async () => {
    setError(null);

    const requiredPlayers = matchType === "ONE_V_ONE" ? 1 : 2;
    if (teamA.length !== requiredPlayers || teamB.length !== requiredPlayers) {
      setError(`Veuillez sélectionner ${requiredPlayers} joueur(s) par équipe`);
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId,
          type: matchType,
          teamA,
          teamB,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création du match");
      }

      const { match } = await response.json();
      onMatchCreated(match.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/50 text-blue-300 px-4 py-3 rounded">
        <p className="text-sm">
          ℹ️ Mode Live : Configurez les équipes puis lancez le match pour
          commencer le scoring en direct
        </p>
      </div>

      {/* Type de match */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-200">
          Type de match
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={matchType === "ONE_V_ONE" ? "default" : "outline"}
            className={
              matchType === "ONE_V_ONE"
                ? "bg-blue-600 hover:bg-blue-700 h-16 text-lg"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200 h-16 text-lg"
            }
            onClick={() => {
              setMatchType("ONE_V_ONE");
              setTeamA([]);
              setTeamB([]);
            }}
          >
            1v1
          </Button>
          <Button
            type="button"
            variant={matchType === "TWO_V_TWO" ? "default" : "outline"}
            className={
              matchType === "TWO_V_TWO"
                ? "bg-blue-600 hover:bg-blue-700 h-16 text-lg"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200 h-16 text-lg"
            }
            onClick={() => {
              setMatchType("TWO_V_TWO");
              setTeamA([]);
              setTeamB([]);
            }}
          >
            2v2
          </Button>
        </div>
      </div>

      {/* Équipe A */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-200">
          Équipe A {matchType === "TWO_V_TWO" && "(2 joueurs)"}
        </label>
        <PlayerSelector
          members={members}
          selectedPlayers={teamA}
          onChange={setTeamA}
          maxPlayers={matchType === "ONE_V_ONE" ? 1 : 2}
          excludePlayers={teamB}
        />
      </div>

      {/* Équipe B */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-200">
          Équipe B {matchType === "TWO_V_TWO" && "(2 joueurs)"}
        </label>
        <PlayerSelector
          members={members}
          selectedPlayers={teamB}
          onChange={setTeamB}
          maxPlayers={matchType === "ONE_V_ONE" ? 1 : 2}
          excludePlayers={teamA}
        />
      </div>

      <Button
        onClick={handleStartMatch}
        disabled={isCreating}
        className="w-full bg-green-600 hover:bg-green-700 h-16 text-lg font-bold"
      >
        {isCreating ? "Démarrage..." : "🚀 Lancer le match"}
      </Button>
    </div>
  );
}

// Composant de sélection de joueurs
function PlayerSelector({
  members,
  selectedPlayers,
  onChange,
  maxPlayers,
  excludePlayers,
}: {
  members: LeagueMember[];
  selectedPlayers: string[];
  onChange: (players: string[]) => void;
  maxPlayers: number;
  excludePlayers: string[];
}) {
  const togglePlayer = (userId: string) => {
    if (selectedPlayers.includes(userId)) {
      onChange(selectedPlayers.filter((id) => id !== userId));
    } else if (selectedPlayers.length < maxPlayers) {
      onChange([...selectedPlayers, userId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {members.map((member) => {
        const isSelected = selectedPlayers.includes(member.userId);
        const isExcluded = excludePlayers.includes(member.userId);
        const isDisabled =
          isExcluded || (!isSelected && selectedPlayers.length >= maxPlayers);

        return (
          <Button
            key={member.userId}
            type="button"
            variant={isSelected ? "default" : "outline"}
            className={`justify-start h-14 ${
              isSelected
                ? "bg-blue-600 hover:bg-blue-700"
                : isDisabled
                ? "border-slate-600 text-slate-400 bg-slate-900 cursor-not-allowed"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
            }`}
            onClick={() => togglePlayer(member.userId)}
            disabled={isDisabled}
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold mr-3">
              {(member.user.displayName || member.user.username)
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <span className="text-base">
              {member.user.displayName || member.user.username}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

// Composant de jeu en direct
function LiveMatchPlay({
  matchId,
  leagueId,
}: {
  matchId: string;
  leagueId: string;
}) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Polling pour récupérer l'état du match
  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/live`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du match:", error);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    // Polling optimisé - aligné avec SSE backend (5s)
    // Justification: Réduit les requêtes client et charge serveur
    const interval = setInterval(fetchMatch, POLLING_INTERVALS.MATCH_LIVE);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  const handleGoal = async (team: "TEAM_A" | "TEAM_B", scorerId?: string) => {
    if (isScoring) return;

    setIsScoring(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, scorerId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du but:", error);
    } finally {
      setIsScoring(false);
    }
  };

  const handleFinish = async () => {
    if (!match) return;

    if (match.scoreTeamA === match.scoreTeamB) {
      alert("Le score ne peut pas être égal !");
      return;
    }

    setIsFinishing(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreTeamA: match.scoreTeamA,
          scoreTeamB: match.scoreTeamB,
        }),
      });

      if (response.ok) {
        router.push(`/leagues/${leagueId}`);
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir annuler ce match ? Il sera supprimé définitivement."
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/leagues/${leagueId}`);
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de l'annulation du match");
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      alert("Une erreur est survenue");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!match) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  const teamAPlayers = match.players.filter((p) => p.team === "TEAM_A");
  const teamBPlayers = match.players.filter((p) => p.team === "TEAM_B");
  const is1v1 = match.type === "ONE_V_ONE";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Score Équipe A */}
      <Card className="bg-linear-to-br from-blue-900/50 to-blue-800/30 border-blue-600">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Équipe A</h3>
            </div>

            <div className="text-7xl font-black text-white">
              {match.scoreTeamA}
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-300">
              {teamAPlayers.map((p) => (
                <span key={p.userId} className="text-sm">
                  {p.user.displayName || p.user.username}
                </span>
              ))}
            </div>

            {!is1v1 && (
              <div className="grid grid-cols-2 gap-2">
                {teamAPlayers.map((p) => (
                  <Button
                    key={p.userId}
                    onClick={() => handleGoal("TEAM_A", p.userId)}
                    disabled={isScoring}
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {(p.user.displayName || p.user.username).split(" ")[0]}
                  </Button>
                ))}
              </div>
            )}

            <Button
              onClick={() =>
                handleGoal(
                  "TEAM_A",
                  is1v1 ? teamAPlayers[0]?.userId : undefined
                )
              }
              disabled={isScoring}
              className="w-full h-20 text-2xl font-bold bg-blue-600 hover:bg-blue-700"
            >
              ⚽ BUT ÉQUIPE A
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Score Équipe B */}
      <Card className="bg-linear-to-br from-red-900/50 to-red-800/30 border-red-600">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Button
              onClick={() =>
                handleGoal(
                  "TEAM_B",
                  is1v1 ? teamBPlayers[0]?.userId : undefined
                )
              }
              disabled={isScoring}
              className="w-full h-20 text-2xl font-bold bg-red-600 hover:bg-red-700"
            >
              ⚽ BUT ÉQUIPE B
            </Button>

            {!is1v1 && (
              <div className="grid grid-cols-2 gap-2">
                {teamBPlayers.map((p) => (
                  <Button
                    key={p.userId}
                    onClick={() => handleGoal("TEAM_B", p.userId)}
                    disabled={isScoring}
                    className="h-14 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {(p.user.displayName || p.user.username).split(" ")[0]}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-slate-300">
              {teamBPlayers.map((p) => (
                <span key={p.userId} className="text-sm">
                  {p.user.displayName || p.user.username}
                </span>
              ))}
            </div>

            <div className="text-7xl font-black text-white">
              {match.scoreTeamB}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">Équipe B</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton Terminer */}
      <Button
        onClick={handleFinish}
        disabled={isFinishing || match.scoreTeamA === match.scoreTeamB}
        className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700"
      >
        {isFinishing ? "Finalisation..." : "✅ Terminer le match"}
      </Button>

      <Button
        onClick={handleCancel}
        disabled={isCancelling}
        variant="outline"
        className="w-full border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
      >
        <X className="h-4 w-4 mr-2" />
        {isCancelling ? "Annulation..." : "Annuler (sans enregistrer)"}
      </Button>
    </div>
  );
}
