import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, adminRole, superadminRole, userRole } from "./auth-ac";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        user: userRole,
        admin: adminRole,
        superadmin: superadminRole,
      },
    }),
  ],
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, useSession, signUp } = authClient;
