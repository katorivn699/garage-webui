import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type BucketPermission = {
  bucket_name: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  manage_lifecycle: boolean;
  delete_bucket: boolean;
};

type User = {
  id: string;
  username: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
  bucket_permissions: BucketPermission[];
};

type AuthResponse = {
  enabled: boolean;
  authenticated: boolean;
  user?: User;
};

export const useAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: () => api.get<AuthResponse>("/auth/status"),
    retry: false,
  });

  const hasPermission = (bucket: string, action: string) => {
    if (!data?.user) return false;
    if (data.user.role === "admin") return true;

    const perm = data.user.bucket_permissions.find(
      (p) => p.bucket_name === bucket
    );
    if (!perm) return false;

    switch (action) {
      case "read":
        return perm.read;
      case "write":
        return perm.write;
      case "delete":
        return perm.delete;
      case "manage_lifecycle":
        return perm.manage_lifecycle;
      case "delete_bucket":
        return perm.delete_bucket;
      default:
        return false;
    }
  };

  return {
    isLoading,
    isEnabled: data?.enabled,
    isAuthenticated: data?.authenticated,
    user: data?.user,
    isAdmin: data?.user?.role === "admin",
    hasPermission,
  };
};
