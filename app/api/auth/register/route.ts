import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation des données
    const validatedData = registerSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le username existe déjà
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(validatedData.password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        displayName: validatedData.displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
