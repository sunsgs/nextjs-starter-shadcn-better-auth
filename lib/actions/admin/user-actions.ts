"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { count, eq } from "drizzle-orm";
import { cache } from "react";

type Role = "user" | "admin" | "superadmin";

export const getUsersCount = cache(async (): Promise<number> => {
  const result = await db.select({ count: count() }).from(user);
  return result[0]?.count ?? 0;
});

// ── Shared guard ──────────────────────────────────────────────────────────────

async function getTargetUser(userId: string) {
  const result = await db.select().from(user).where(eq(user.id, userId));
  return result[0] ?? null;
}

function assertCanActOn(
  actorRole: string,
  targetRole: string,
  action = "act on",
) {
  if (targetRole === "superadmin" && actorRole !== "superadmin") {
    throw new Error(`Only a superadmin can ${action} another superadmin`);
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function deleteUser(userId: string): Promise<void> {
  const session = await requireSession();
  const actor = session.user;

  if (actor.role !== "admin" && actor.role !== "superadmin") {
    throw new Error("Unauthorized");
  }
  if (actor.id === userId) throw new Error("Cannot delete your own account");

  const target = await getTargetUser(userId);
  if (!target) throw new Error("User not found");

  assertCanActOn(actor.role ?? "", target.role ?? "", "delete");

  await db.delete(user).where(eq(user.id, userId));
}

export async function updateUser(
  userId: string,
  data: { name: string; email: string; role: Role; password?: string },
): Promise<void> {
  const session = await requireSession();
  const actor = session.user;

  const target = await getTargetUser(userId);
  if (!target) throw new Error("User not found");

  assertCanActOn(actor.role ?? "", target.role ?? "", "update");

  if (data.role === "superadmin" && actor.role !== "superadmin") {
    throw new Error("Only a superadmin can assign the superadmin role");
  }

  const fields: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    role: data.role,
  };
  if (data.password && data.password !== "") {
    fields.password = data.password;
  }

  await db.update(user).set(fields).where(eq(user.id, userId));
}
