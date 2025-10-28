/**
 * Layout Leagues - Server Component
 */

import AuthenticatedLayout from "@/components/layouts/authenticated-layout";

export default function LeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
