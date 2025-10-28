import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed...");

  // Créer des utilisateurs de test
  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      username: "alice",
      password: await hashPassword("password123"),
      displayName: "Alice Martin",
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      username: "bob",
      password: await hashPassword("password123"),
      displayName: "Bob Dupont",
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      username: "charlie",
      password: await hashPassword("password123"),
      displayName: "Charlie Petit",
    },
  });

  const david = await prisma.user.create({
    data: {
      email: "david@example.com",
      username: "david",
      password: await hashPassword("password123"),
      displayName: "David Moreau",
    },
  });

  console.log("✅ 4 utilisateurs créés");

  // Créer une ligue
  const league = await prisma.league.create({
    data: {
      name: "Bureau Paris",
      description: "Ligue de babyfoot du bureau de Paris",
      isPublic: false,
      ownerId: alice.id,
      memberships: {
        create: [
          { userId: alice.id, role: "owner" },
          { userId: bob.id, role: "member" },
          { userId: charlie.id, role: "member" },
          { userId: david.id, role: "member" },
        ],
      },
    },
  });

  console.log("✅ Ligue créée:", league.name);

  // Créer les ratings Elo initiaux
  await prisma.eloRating.createMany({
    data: [
      { userId: alice.id, leagueId: league.id, rating: 1000 },
      { userId: bob.id, leagueId: league.id, rating: 1000 },
      { userId: charlie.id, leagueId: league.id, rating: 1000 },
      { userId: david.id, leagueId: league.id, rating: 1000 },
    ],
  });

  console.log("✅ Ratings Elo initialisés à 1000");

  // Créer quelques matchs de test
  const match1 = await prisma.match.create({
    data: {
      leagueId: league.id,
      type: "ONE_V_ONE",
      status: "FINISHED",
      scoreTeamA: 10,
      scoreTeamB: 7,
      finishedAt: new Date(),
      players: {
        create: [
          { userId: alice.id, team: "TEAM_A", position: 0 },
          { userId: bob.id, team: "TEAM_B", position: 0 },
        ],
      },
    },
  });

  const match2 = await prisma.match.create({
    data: {
      leagueId: league.id,
      type: "TWO_V_TWO",
      status: "FINISHED",
      scoreTeamA: 10,
      scoreTeamB: 8,
      finishedAt: new Date(),
      players: {
        create: [
          { userId: alice.id, team: "TEAM_A", position: 0 },
          { userId: charlie.id, team: "TEAM_A", position: 1 },
          { userId: bob.id, team: "TEAM_B", position: 0 },
          { userId: david.id, team: "TEAM_B", position: 1 },
        ],
      },
    },
  });

  console.log("✅ 2 matchs créés (terminés)");

  // Mettre à jour les Elo manuellement pour l'exemple
  await prisma.eloRating.update({
    where: { userId_leagueId: { userId: alice.id, leagueId: league.id } },
    data: { rating: 1016, matchesWon: 2, winStreak: 2, bestStreak: 2 },
  });

  await prisma.eloRating.update({
    where: { userId_leagueId: { userId: bob.id, leagueId: league.id } },
    data: { rating: 984, matchesLost: 2 },
  });

  await prisma.eloRating.update({
    where: { userId_leagueId: { userId: charlie.id, leagueId: league.id } },
    data: {
      rating: 1008,
      matchesWon: 1,
      matchesLost: 0,
      winStreak: 1,
      bestStreak: 1,
    },
  });

  await prisma.eloRating.update({
    where: { userId_leagueId: { userId: david.id, leagueId: league.id } },
    data: { rating: 992, matchesLost: 1 },
  });

  console.log("✅ Ratings Elo mis à jour");

  // Créer un match en cours
  await prisma.match.create({
    data: {
      leagueId: league.id,
      type: "ONE_V_ONE",
      status: "IN_PROGRESS",
      scoreTeamA: 5,
      scoreTeamB: 3,
      players: {
        create: [
          { userId: charlie.id, team: "TEAM_A", position: 0 },
          { userId: david.id, team: "TEAM_B", position: 0 },
        ],
      },
    },
  });

  console.log("✅ 1 match en cours créé");

  console.log("");
  console.log("🎉 Seed terminé avec succès !");
  console.log("");
  console.log("📝 Utilisateurs créés :");
  console.log("   - alice@example.com / password123");
  console.log("   - bob@example.com / password123");
  console.log("   - charlie@example.com / password123");
  console.log("   - david@example.com / password123");
  console.log("");
  console.log(`📊 Ligue créée : "${league.name}"`);
  console.log(`   Code d'invitation : ${league.inviteCode}`);
  console.log("");
  console.log("🎮 3 matchs créés (2 terminés, 1 en cours)");
  console.log("");
  console.log("🚀 Vous pouvez maintenant :");
  console.log("   - Démarrer le serveur : npm run dev");
  console.log("   - Ouvrir Prisma Studio : npm run db:studio");
  console.log("   - Tester l'API avec les comptes créés");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
