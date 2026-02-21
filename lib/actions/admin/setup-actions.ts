"use server";

import { auth } from "@/lib/auth";
import { getUsersCount } from "./user-actions";

interface SetupAdminInput {
  name: string;
  email: string;
  password: string;
}

export async function setupFirstAdmin(input: SetupAdminInput): Promise<void> {
  // Guard: only callable when no users exist — prevents privilege escalation
  const count = await getUsersCount();
  if (count > 0) {
    throw new Error("Setup already complete.");
  }

  // auth.api methods throw on failure — they do NOT return { error }.
  // Wrap in try/catch and re-throw a plain string message so the client
  // always receives an Error with a .message string, never an object.
  try {
    await auth.api.createUser({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: "admin",
      },
    });
  } catch (err) {
    // better-auth throws APIError objects with a .message string.
    // Re-throw as a plain Error so the caller always gets err.message.
    const message =
      err instanceof Error ? err.message : "Failed to create admin account.";
    throw new Error(message);
  }
}
