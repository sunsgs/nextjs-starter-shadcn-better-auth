import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await requireSession();

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/admin");
  }

  return <UsersClient newInstallation={false} />;
}
