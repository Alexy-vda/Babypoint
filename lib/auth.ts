import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-change-this";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  displayName?: string | null;
}

// Générer un token JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Vérifier un token JWT
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Hasher un mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Comparer un mot de passe
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
