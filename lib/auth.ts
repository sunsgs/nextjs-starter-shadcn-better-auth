import { db } from "@/db";
import { schema } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { ac, adminRole, superadminRole, userRole } from "./auth-ac";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    admin({
      ac,
      roles: {
        user: userRole,
        admin: adminRole,
        superadmin: superadminRole,
      },
      allowImpersonatingAdmins: true,
      adminRoles: ["admin", "superadmin"],
    }),
  ],
});
