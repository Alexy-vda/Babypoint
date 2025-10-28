"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const joinLeagueSchema = z.object({
  inviteCode: z.string().min(1, "Le code d'invitation est requis"),
});

type JoinLeagueForm = z.infer<typeof joinLeagueSchema>;

export default function JoinLeaguePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinLeagueForm>({
    resolver: zodResolver(joinLeagueSchema),
  });

  const onSubmit = async (data: JoinLeagueForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de la connexion à la ligue"
        );
      }

      // Rediriger vers la page de la ligue
      router.push(`/leagues/${result.league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-white">Rejoindre une ligue</h1>
          <p className="text-slate-400 mt-1">
            Entrez le code d&apos;invitation pour rejoindre une ligue
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-500" />
            Code d&apos;invitation
          </CardTitle>
          <CardDescription className="text-slate-400">
            Le code vous a été fourni par le créateur de la ligue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-slate-200">
                Code d&apos;invitation
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="ex: ABC123DEF456"
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 font-mono uppercase"
                {...register("inviteCode")}
                onChange={(e) => {
                  e.target.value = e.target.value;
                }}
              />
              {errors.inviteCode && (
                <p className="text-sm text-red-400">
                  {errors.inviteCode.message}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Le code est sensible à la casse et peut contenir des lettres et
                des chiffres
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded">
              <p className="text-sm font-semibold mb-1">⚠️ Attention</p>
              <p className="text-sm">
                Si vous êtes déjà dans une ligue, vous devrez d&apos;abord la
                quitter depuis votre dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Rejoindre la ligue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-300 bg-slate-800"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alternative */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <h3 className="text-white font-semibold mb-3">
            Vous n&apos;avez pas de code ?
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Si vous souhaitez créer votre propre ligue et inviter vos amis, vous
            pouvez :
          </p>
          <Button
            asChild
            variant="outline"
            className="border-slate-600 text-slate-300 bg-slate-800"
          >
            <Link href="/leagues/create">Créer une nouvelle ligue</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <h3 className="text-white font-semibold mb-3">Comment ça marche ?</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              • Le créateur de la ligue vous fournit un code d&apos;invitation
              unique
            </li>
            <li>• Vous pouvez aussi scanner un QR code si disponible</li>
            <li>• Une fois rejoint, vous apparaîtrez dans le classement</li>
            <li>• Vos statistiques commenceront à être comptabilisées</li>
            <li>• Vous pouvez quitter la ligue à tout moment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
