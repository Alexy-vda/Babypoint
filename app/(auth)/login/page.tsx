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
import { useUserStore } from "@/lib/store";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur de connexion");
      }

      // Récupérer les informations de l'utilisateur
      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (userResponse.ok) {
        setUser(userData.user);
        router.push("/dashboard");
      } else {
        throw new Error("Impossible de récupérer les informations utilisateur");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Connexion</CardTitle>
        <CardDescription className="text-slate-400">
          Connectez-vous à votre compte BabyPoint
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>

          <p className="text-sm text-center text-slate-400">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
