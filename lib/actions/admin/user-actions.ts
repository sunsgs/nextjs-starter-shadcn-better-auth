"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { count, eq } from "drizzle-orm";
import { cache } from "react";

export const getUsersCount = cache(async (): Promise<number> => {
  const result = await db.select({ count: count() }).from(user);
  return result[0]?.count ?? 0;
});

export async function deleteUser(userId: string): Promise<void> {
  const session = await requireSession();
  if (session.user.role !== "admin") throw new Error("Unauthorized");
  if (session.user.id === userId)
    throw new Error("Cannot delete your own account");

  await db.delete(user).where(eq(user.id, userId));
}

export async function updateUser(
  userId: string,
  data: { name: string; email: string },
): Promise<void> {
  await requireSession(); // any authenticated user can trigger, but UI limits to admin
  await db.update(user).set(data).where(eq(user.id, userId));
}
