/**
 * Layout authentifié partagé - Server Component
 * Utilisé par dashboard, leagues, players
 */

import { Navbar } from "@/components/navbar";
import { getUserFromCookies } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
