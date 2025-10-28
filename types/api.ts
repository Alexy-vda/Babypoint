/**
 * Types partagés pour les réponses API
 * Centralisés pour éviter la duplication et garantir la cohérence
 */

// ============= USER TYPES =============

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface ApiUserWithStats extends ApiUser {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
}

// ============= LEAGUE TYPES =============

export interface ApiLeague {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdAt: string;
  ownerId: string;
  _count: {
    memberships: number;
    matches: number;
  };
}

export interface ApiLeagueMember {
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface ApiLeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  rating: number;
  matchesWon: number;
  matchesLost: number;
  totalMatches: number;
  winRate: number;
}

// ============= MATCH TYPES =============

export type MatchStatus = "IN_PROGRESS" | "FINISHED" | "CANCELLED";
export type MatchType = "ONE_V_ONE" | "TWO_V_TWO";
export type Team = "TEAM_A" | "TEAM_B";

export interface ApiMatchPlayer {
  userId: string;
  team: Team;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface ApiMatch {
  id: string;
  type: MatchType;
  status: MatchStatus;
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: string;
  finishedAt: string | null;
  players: ApiMatchPlayer[];
}

export interface ApiMatchWithLeague extends ApiMatch {
  league: {
    id: string;
    name: string;
  };
}

// ============= DASHBOARD TYPES =============

export interface ApiDashboardStats {
  totalLeagues: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  recentMatches: ApiMatch[];
  topLeagues: Array<{
    league: ApiLeague;
    rating: number;
    rank: number;
  }>;
}

// ============= FORM TYPES =============

export interface CreateMatchInput {
  leagueId: string;
  type: MatchType;
  teamA: string[];
  teamB: string[];
}

export interface FinishMatchInput {
  scoreTeamA: number;
  scoreTeamB: number;
}

export interface CreateLeagueInput {
  name: string;
  description?: string;
}

// ============= API RESPONSE TYPES =============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

// ============= SSE TYPES =============

export interface SseMatchData {
  id: string;
  status: MatchStatus;
  type: MatchType;
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: string;
  finishedAt: string | null;
  players: ApiMatchPlayer[];
}

// ============= PRISMA HELPER TYPES =============

// Types dérivés de Prisma pour garantir la cohérence avec le schéma DB
// Note: Prisma.XxxGetPayload n'est pas disponible, on utilise les types directement

export type PrismaMatchWithPlayers = {
  id: string;
  type: MatchType;
  status: MatchStatus;
  scoreTeamA: number;
  scoreTeamB: number;
  startedAt: Date;
  finishedAt: Date | null;
  players: {
    userId: string;
    team: Team;
    user: {
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
    };
  }[];
};

export type PrismaLeagueWithCounts = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdAt: Date;
  ownerId: string;
  _count: {
    memberships: number;
    matches: number;
  };
};
