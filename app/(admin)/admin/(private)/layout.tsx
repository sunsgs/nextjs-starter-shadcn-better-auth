import { ImpersonationBanner } from "@/components/admin/impersonating-banner";
import { Nav } from "@/components/admin/nav";
import { requireSession } from "@/lib/auth/session";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <>
      <ImpersonationBanner />
      <Nav role={session.user.role ?? "user"} />{" "}
      {/* ← pass down, no client fetch */}
      {children}
    </>
  );
}
