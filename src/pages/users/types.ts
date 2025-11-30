import { UserRole } from "./schema";

export type User = {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  bucket_permissions: string[];
};
