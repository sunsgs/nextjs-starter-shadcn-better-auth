import { getUsersCount } from "@/lib/actions/admin/user-actions";
import { redirect } from "next/navigation";
import { UsersClient } from "../(private)/users/users-client";

export default async function SetupPage() {
  const usersCount = await getUsersCount();
  if (usersCount > 0) redirect("/admin/login");

  return <UsersClient newInstallation={true} />;
}
