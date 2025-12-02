import { UserRole } from "./schema";

export type BucketPermission = {
  bucket_name: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  manage_lifecycle: boolean;
  delete_bucket: boolean;
};

export type User = {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  bucket_permissions: BucketPermission[];
};
