/**
 * Utilitaires d'authentification côté serveur
 * Pour Server Actions et Server Components uniquement
 */

import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export interface ServerUser {
  userId: string;
  email: string;
  username: string;
  displayName?: string | null;
}

/**
 * Récupère l'utilisateur depuis les cookies
 * Retourne null si non authentifié
 */
export async function getUserFromCookies(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      displayName: payload.displayName,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 * Lance une erreur si non authentifié
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getUserFromCookies();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user;
}
