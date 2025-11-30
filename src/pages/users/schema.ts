import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleSchema,
  bucket_permissions: z.array(z.string()).optional().default([]),
});

export const updateUserSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: userRoleSchema.optional(),
  bucket_permissions: z.array(z.string()).optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
