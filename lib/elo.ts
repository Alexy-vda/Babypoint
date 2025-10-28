// ============================================
// Calcul du rating Elo
// ============================================

/**
 * Constante K-factor pour le système Elo
 * Plus K est élevé, plus les changements de rating sont importants
 */
const K_FACTOR = 32;

/**
 * Calcule la probabilité de victoire attendue pour un joueur
 * @param ratingA - Rating du joueur A
 * @param ratingB - Rating du joueur B
 * @returns Probabilité de victoire (entre 0 et 1)
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calcule le nouveau rating après un match
 * @param currentRating - Rating actuel du joueur
 * @param opponentRating - Rating de l'adversaire
 * @param actualScore - Score réel (1 pour victoire, 0 pour défaite, 0.5 pour égalité)
 * @returns Nouveau rating
 */
export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number
): number {
  const expected = expectedScore(currentRating, opponentRating);
  const change = Math.round(K_FACTOR * (actualScore - expected));
  return currentRating + change;
}

/**
 * Calcule le changement de rating
 * @param currentRating - Rating actuel du joueur
 * @param opponentRating - Rating de l'adversaire
 * @param actualScore - Score réel (1 pour victoire, 0 pour défaite)
 * @returns Changement de rating (peut être négatif)
 */
export function calculateRatingChange(
  currentRating: number,
  opponentRating: number,
  actualScore: number
): number {
  const expected = expectedScore(currentRating, opponentRating);
  return Math.round(K_FACTOR * (actualScore - expected));
}

/**
 * Calcule les nouveaux ratings pour un match 1v1
 * @param ratingA - Rating du joueur A
 * @param ratingB - Rating du joueur B
 * @param teamAWon - true si l'équipe A a gagné
 * @returns Nouveaux ratings pour les deux joueurs
 */
export function calculate1v1Ratings(
  ratingA: number,
  ratingB: number,
  teamAWon: boolean
): {
  newRatingA: number;
  newRatingB: number;
  changeA: number;
  changeB: number;
} {
  const scoreA = teamAWon ? 1 : 0;
  const scoreB = teamAWon ? 0 : 1;

  const changeA = calculateRatingChange(ratingA, ratingB, scoreA);
  const changeB = calculateRatingChange(ratingB, ratingA, scoreB);

  return {
    newRatingA: ratingA + changeA,
    newRatingB: ratingB + changeB,
    changeA,
    changeB,
  };
}

/**
 * Calcule les nouveaux ratings pour un match 2v2
 * Pour un 2v2, on utilise la moyenne des ratings de chaque équipe
 * @param ratingsTeamA - Array des ratings de l'équipe A
 * @param ratingsTeamB - Array des ratings de l'équipe B
 * @param teamAWon - true si l'équipe A a gagné
 * @returns Nouveaux ratings pour tous les joueurs
 */
export function calculate2v2Ratings(
  ratingsTeamA: number[],
  ratingsTeamB: number[],
  teamAWon: boolean
): {
  newRatingsTeamA: number[];
  newRatingsTeamB: number[];
  changesTeamA: number[];
  changesTeamB: number[];
} {
  // Calcul de la moyenne des ratings de chaque équipe
  const avgRatingA =
    ratingsTeamA.reduce((sum, r) => sum + r, 0) / ratingsTeamA.length;
  const avgRatingB =
    ratingsTeamB.reduce((sum, r) => sum + r, 0) / ratingsTeamB.length;

  const scoreA = teamAWon ? 1 : 0;
  const scoreB = teamAWon ? 0 : 1;

  // Calcul des changements pour chaque joueur
  const changesTeamA = ratingsTeamA.map((rating) =>
    calculateRatingChange(rating, avgRatingB, scoreA)
  );
  const changesTeamB = ratingsTeamB.map((rating) =>
    calculateRatingChange(rating, avgRatingA, scoreB)
  );

  return {
    newRatingsTeamA: ratingsTeamA.map(
      (rating, idx) => rating + changesTeamA[idx]
    ),
    newRatingsTeamB: ratingsTeamB.map(
      (rating, idx) => rating + changesTeamB[idx]
    ),
    changesTeamA,
    changesTeamB,
  };
}
