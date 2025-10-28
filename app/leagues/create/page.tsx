"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Trophy } from "lucide-react";
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

const createLeagueSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  description: z
    .string()
    .max(200, "La description ne peut pas dépasser 200 caractères")
    .optional(),
});

type CreateLeagueForm = z.infer<typeof createLeagueSchema>;

export default function CreateLeaguePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeagueForm>({
    resolver: zodResolver(createLeagueSchema),
  });

  const onSubmit = async (data: CreateLeagueForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de la création de la ligue"
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
          <h1 className="text-3xl font-bold text-white">Créer une ligue</h1>
          <p className="text-slate-400 mt-1">
            Créez votre propre ligue et invitez vos amis
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            Informations de la ligue
          </CardTitle>
          <CardDescription className="text-slate-400">
            Choisissez un nom unique pour votre ligue
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
              <Label htmlFor="name" className="text-slate-200">
                Nom de la ligue *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Bureau Paris, Tournoi 2025, etc."
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">
                Description (optionnel)
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="Une courte description de votre ligue"
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-400">
                  {errors.description.message}
                </p>
              )}
              <p className="text-xs text-slate-500">Maximum 200 caractères</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 text-blue-300 px-4 py-3 rounded">
              <p className="text-sm">
                ℹ️ Une fois créée, vous pourrez générer un code
                d&apos;invitation et un QR code pour inviter d&apos;autres
                joueurs.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Création..." : "Créer la ligue"}
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

      {/* Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <h3 className="text-white font-semibold mb-3">À propos des ligues</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              • Chaque joueur ne peut être que dans une seule ligue à la fois
            </li>
            <li>• Vous serez automatiquement le créateur de cette ligue</li>
            <li>• Vos statistiques sont spécifiques à chaque ligue</li>
            <li>• Vous pourrez quitter la ligue à tout moment</li>
            <li>
              • Un code d&apos;invitation unique sera généré automatiquement
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
