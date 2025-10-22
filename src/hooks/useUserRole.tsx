import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'free' | 'pro' | 'enterprise';

export function useUserRole() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return 'free' as UserRole;
      }

      return (data?.role || 'free') as UserRole;
    },
  });

  const hasAccess = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'free': 0,
      'pro': 1,
      'enterprise': 2,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const limits = {
    free: {
      clipsPerMonth: 5,
      customBranding: false,
      logoUpload: false,
    },
    pro: {
      clipsPerMonth: 30,
      customBranding: true,
      logoUpload: true,
    },
    enterprise: {
      clipsPerMonth: -1, // unlimited
      customBranding: true,
      logoUpload: true,
    },
  };

  return {
    role,
    isLoading,
    hasAccess,
    limits: limits[role || 'free'],
    isPro: role === 'pro',
    isEnterprise: role === 'enterprise',
    isFree: role === 'free',
  };
}
