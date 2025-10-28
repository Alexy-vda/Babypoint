import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation des données
    const validatedData = loginSchema.parse(body);

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    });

    // Créer la réponse avec le cookie
    const response = NextResponse.json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    });

    // Définir le cookie avec le token
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
