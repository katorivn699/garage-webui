import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export const bucketPermissionSchema = z.object({
  bucket_name: z.string(),
  read: z.boolean().default(false),
  write: z.boolean().default(false),
  delete: z.boolean().default(false),
  manage_lifecycle: z.boolean().default(false),
  delete_bucket: z.boolean().default(false),
});

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleSchema,
  bucket_permissions: z.array(bucketPermissionSchema).optional().default([]),
});

export const updateUserSchema = z.object({
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || val.length >= 6,
      "Password must be at least 6 characters"
    ),
  role: userRoleSchema.optional(),
  bucket_permissions: z.array(bucketPermissionSchema).optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type BucketPermission = z.infer<typeof bucketPermissionSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
