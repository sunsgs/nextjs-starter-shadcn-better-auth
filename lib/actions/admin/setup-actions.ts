"use server";

import { auth } from "@/lib/auth";
import { getUsersCount } from "./user-actions";

interface SetupAdminInput {
  name: string;
  email: string;
  password: string;
}

export async function setupFirstAdmin(input: SetupAdminInput): Promise<void> {
  const count = await getUsersCount();
  if (count > 0) {
    throw new Error("Setup already complete.");
  }

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
    const message =
      err instanceof Error ? err.message : "Failed to create admin account.";
    throw new Error(message);
  }
}
