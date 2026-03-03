import z from "zod";

export const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  role: z.enum(["user", "admin", "superadmin"]),
});

export const editUserFormSchema = userFormSchema.extend({
  password: z
    .string()
    .refine(
      (val) => val === "" || (val.length >= 8 && val.length <= 128),
      "Password must be at least 8 characters",
    ),
});
