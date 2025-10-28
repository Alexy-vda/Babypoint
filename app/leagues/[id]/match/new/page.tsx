"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveMatch } from "@/components/match/live-match";

interface NewMatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface LeagueMember {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export default function NewMatchPage({ params }: NewMatchPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const leagueId = resolvedParams.id;

  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"simple" | "live">("simple");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.league.memberships || []);
        } else {
          router.push(`/leagues/${leagueId}`);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
        router.push(`/leagues/${leagueId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [leagueId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-slate-500/50"
        >
          <Link href={`/leagues/${leagueId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouveau match</h1>
          <p className="text-slate-400 mt-1">
            Enregistrez un match ou lancez un match en direct
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "simple" | "live")}
        className="space-y-6"
      >
        <TabsList className="bg-slate-800 border-slate-700 grid w-full grid-cols-2">
          <TabsTrigger value="simple">
            <Trophy className="h-4 w-4 mr-2" />
            Saisie simple
          </TabsTrigger>
          <TabsTrigger value="live">
            <Users className="h-4 w-4 mr-2" />
            Mode Live
          </TabsTrigger>
        </TabsList>

        {/* Simple Mode */}
        <TabsContent value="simple">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Enregistrer un match</CardTitle>
              <CardDescription className="text-slate-400">
                Saisissez les résultats d&apos;un match déjà joué
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleMatchForm leagueId={leagueId} members={members} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Mode */}
        <TabsContent value="live">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Match en direct</CardTitle>
              <CardDescription className="text-slate-400">
                Lancez un match et enregistrez les buts en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveMatch leagueId={leagueId} members={members} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant SimpleMatchForm
function SimpleMatchForm({
  leagueId,
  members,
}: {
  leagueId: string;
  members: LeagueMember[];
}) {
  const router = useRouter();
  const [matchType, setMatchType] = useState<"ONE_V_ONE" | "TWO_V_TWO">(
    "ONE_V_ONE"
  );
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const requiredPlayers = matchType === "ONE_V_ONE" ? 1 : 2;
    if (teamA.length !== requiredPlayers || teamB.length !== requiredPlayers) {
      setError(`Veuillez sélectionner ${requiredPlayers} joueur(s) par équipe`);
      return;
    }

    if (scoreA === scoreB) {
      setError("Le score ne peut pas être égal (pas de match nul)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Créer le match
      const createResponse = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId,
          type: matchType,
          teamA,
          teamB,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.error || "Erreur lors de la création du match");
      }

      const { match } = await createResponse.json();

      // Terminer le match avec les scores
      const finishResponse = await fetch(`/api/matches/${match.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreTeamA: scoreA,
          scoreTeamB: scoreB,
        }),
      });

      if (!finishResponse.ok) {
        const data = await finishResponse.json();
        throw new Error(
          data.error || "Erreur lors de la finalisation du match"
        );
      }

      // Rediriger vers la page de la ligue
      router.push(`/leagues/${leagueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
                ? "bg-blue-600 hover:bg-blue-700"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
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
                ? "bg-blue-600 hover:bg-blue-700"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
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

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Score Équipe A
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={scoreA}
            onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-3 text-white text-2xl font-bold text-center"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Score Équipe B
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={scoreB}
            onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded px-4 py-3 text-white text-2xl font-bold text-center"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer le match"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

// Composant PlayerSelector
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
            className={`justify-start ${
              isSelected
                ? "bg-blue-600 hover:bg-blue-700"
                : isDisabled
                ? "border-slate-600 text-slate-400 bg-slate-900 cursor-not-allowed"
                : "border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-900 hover:text-slate-200"
            }`}
            onClick={() => togglePlayer(member.userId)}
            disabled={isDisabled}
          >
            <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold mr-2">
              {(member.user.displayName || member.user.username)
                .substring(0, 2)
                .toUpperCase()}
            </div>
            {member.user.displayName || member.user.username}
          </Button>
        );
      })}
    </div>
  );
}
