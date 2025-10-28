import { z } from "zod";

// ============================================
// Schémas d'authentification
// ============================================

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(30),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// ============================================
// Schémas de ligue
// ============================================

export const createLeagueSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const updateLeagueSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const joinLeagueSchema = z.object({
  inviteCode: z.string().min(1, "Code d'invitation requis"),
});

// ============================================
// Schémas de match
// ============================================

export const createMatchSchema = z
  .object({
    leagueId: z.string().cuid(),
    type: z.enum(["ONE_V_ONE", "TWO_V_TWO"]),
    teamA: z.array(z.string().cuid()).min(1).max(2),
    teamB: z.array(z.string().cuid()).min(1).max(2),
  })
  .refine(
    (data) => {
      if (data.type === "ONE_V_ONE") {
        return data.teamA.length === 1 && data.teamB.length === 1;
      }
      if (data.type === "TWO_V_TWO") {
        return data.teamA.length === 2 && data.teamB.length === 2;
      }
      return false;
    },
    {
      message: "Le nombre de joueurs doit correspondre au type de match",
    }
  );

export const updateMatchScoreSchema = z.object({
  scoreTeamA: z.number().int().min(0),
  scoreTeamB: z.number().int().min(0),
});

export const finishMatchSchema = z
  .object({
    scoreTeamA: z.number().int().min(0),
    scoreTeamB: z.number().int().min(0),
  })
  .refine((data) => data.scoreTeamA !== data.scoreTeamB, {
    message: "Le score ne peut pas être égal (pas de match nul au babyfoot)",
  });

// ============================================
// Types TypeScript générés
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;
export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;
export type JoinLeagueInput = z.infer<typeof joinLeagueSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchScoreInput = z.infer<typeof updateMatchScoreSchema>;
export type FinishMatchInput = z.infer<typeof finishMatchSchema>;
