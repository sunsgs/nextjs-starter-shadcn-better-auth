import { db } from "@/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getUsersCount() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(user);

  return Number(result[0]?.count ?? 0);
}
