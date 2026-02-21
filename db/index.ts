import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { schema } from "./schema";

config({ path: ".env.local" }); // or .env.local

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  schema,
});
