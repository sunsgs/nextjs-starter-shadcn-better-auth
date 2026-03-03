import { Nav } from "@/components/admin/nav";
import { requireSession } from "@/lib/auth/session";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesssion = await requireSession();
  return (
    <>
      <Nav role={sesssion.user.role || "user"} />
      {children}
    </>
  );
}
