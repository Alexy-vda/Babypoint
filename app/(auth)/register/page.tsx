"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'inscription");
      }

      // Rediriger vers la page de connexion après l'inscription
      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Créer un compte</CardTitle>
        <CardDescription className="text-slate-400">
          Rejoignez BabyPoint et suivez vos matchs
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.fr"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Création..." : "Créer mon compte"}
          </Button>

          <p className="text-sm text-center text-slate-400">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
