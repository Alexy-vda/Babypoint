/**
 * Layout Players - Server Component
 */

import AuthenticatedLayout from "@/components/layouts/authenticated-layout";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
