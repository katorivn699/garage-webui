import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  username: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
  bucket_permissions: string[];
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
  return {
    isLoading,
    isEnabled: data?.enabled,
    isAuthenticated: data?.authenticated,
    user: data?.user,
    isAdmin: data?.user?.role === "admin",
  };
};
