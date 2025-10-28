/**
 * Configuration des intervalles de polling et cache
 * Optimisé pour équilibrer temps réel et performance
 */

export const POLLING_INTERVALS = {
  /** Match en direct - 5s permet temps réel acceptable avec charge DB réduite */
  MATCH_LIVE: 5000,
  /** Leaderboard - mise à jour moins critique */
  LEADERBOARD: 30000,
  /** Dashboard stats - données agrégées, pas besoin de temps réel */
  DASHBOARD: 60000,
} as const;

export const CACHE_TIMES = {
  /** Données de ligue - changent rarement */
  LEAGUE: 60, // 1 minute
  /** Leaderboard - calculs Elo après chaque match */
  LEADERBOARD: 30, // 30 secondes
  /** Liste des matchs - nouveaux matchs fréquents */
  MATCHES: 10, // 10 secondes
  /** Stats dashboard - agrégations lourdes */
  DASHBOARD_STATS: 300, // 5 minutes
  /** QR codes - statiques */
  QR_CODE: 86400, // 24 heures
} as const;

export const API_LIMITS = {
  /** Requêtes par utilisateur par fenêtre */
  REQUESTS_PER_WINDOW: 100,
  /** Durée de la fenêtre en secondes */
  WINDOW_DURATION: 60,
} as const;

export const UI_CONSTANTS = {
  /** Délai avant réinitialisation du feedback visuel */
  TOAST_DURATION: 3000,
  /** Délai avant masquer "Copié" */
  COPY_FEEDBACK_DURATION: 2000,
  /** Timeout pour requêtes API */
  API_TIMEOUT: 30000,
} as const;
