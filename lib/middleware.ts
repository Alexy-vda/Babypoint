import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

// Middleware pour vérifier l'authentification
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = user;

    return handler(authReq);
  };
}

// Récupérer l'utilisateur depuis les cookies
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
