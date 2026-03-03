import { requireSession } from "@/lib/auth/session";

export default async function Page() {
  const session = await requireSession("/admin/settings");
  console.log(session, "open settings");
  return <div>Hello,</div>;
}
