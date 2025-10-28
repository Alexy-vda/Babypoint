# 🎯 BabyPoint

A modern web app to track foosball matches at work, manage teams, and generate fun statistics with a credible Elo ranking system.

## 🚀 Tech Stack

- **Next.js 16** - React Server Components, App Router, Server Actions
- **React 19** - Modern React with RSC architecture
- **TypeScript** - Full type safety
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **JWT** - Cookie-based authentication

## ✨ Features

### 🎮 Match Management
- Create **1v1 or 2v2** matches
- Select players and define Team A/B
- Enter scores in **real-time** with live updates
- Complete match history with filters

### 🏆 Ranking System
- **Elo rating** algorithm (adapted for 1v1 and 2v2)
- Real-time leaderboard
- Automatic updates after each match
- Separate rankings per league

### 📊 Player Statistics
- Win rate and match count
- Current and record win streaks
- Favorite teammates with performance stats
- Rival opponents and head-to-head history
- Elo rating evolution over time

### 🏢 League System
- Create and join multiple leagues
- QR code invitations for easy sharing
- Per-league rankings and statistics
- Admin controls for league management

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd babypoint
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/babypoint"
JWT_SECRET="your-secret-key"
```

4. Start the database (using Docker)
```bash
npm run docker:up
```

5. Run database migrations
```bash
npm run db:push
```

6. (Optional) Seed the database with test data
```bash
npm run db:seed
```

7. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:migrate` - Create a new migration
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data
- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop PostgreSQL container

## ��️ Project Structure

```
babypoint/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── leagues/           # League pages
│   ├── players/           # Player pages
│   ├── actions/           # Server Actions
│   └── api/               # API routes (SSE, webhooks)
├── components/            # React components
│   ├── layouts/          # Layout components
│   ├── league/           # League-specific components
│   ├── match/            # Match-specific components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── auth-server.ts    # Server-side auth
│   ├── elo.ts            # Elo calculation algorithm
│   └── prisma.ts         # Prisma client
└── prisma/               # Database schema and migrations
```

## �� Key Features Explained

### Elo Rating System
The app uses a modified Elo algorithm that:
- Adjusts for team matches (2v2) by averaging team ratings
- Applies a K-factor of 32 for standard volatility
- Starts new players at 1000 rating
- Updates ratings immediately after each match

### Real-time Match Updates
Matches support live score updates using Server-Sent Events (SSE):
- Players can update scores in real-time
- All viewers see updates instantly
- No polling or websockets needed

### League System
- Each league has independent rankings
- Players can join multiple leagues
- QR codes for easy mobile invitations
- League admins can manage members

## 🔒 Authentication

The app uses JWT-based authentication with:
- Secure HTTP-only cookies
- Server-side token verification
- Password hashing with bcrypt
- Protected routes using middleware

## 📱 Responsive Design

Fully responsive interface that works on:
- Desktop browsers
- Tablets
- Mobile phones
