import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/proxy-client";
import type { AppRole } from "@/lib/admin-access";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  rolesError: string | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCatalogEditor: boolean;
  retryRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(true);
  const requestIdRef = useRef(0);
  const sessionRef = useRef<Session | null>(null);

  const fetchRoles = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (error) throw error;
    return (data?.map((row) => row.role as AppRole)) ?? [];
  }, []);

  const hydrateSession = useCallback(async (nextSession: Session | null) => {
    const currentRequest = ++requestIdRef.current;
    sessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setRoles([]);
    setRolesError(null);
    setLoading(true);

    if (!nextSession?.user) {
      if (activeRef.current && currentRequest === requestIdRef.current) setLoading(false);
      return;
    }

    try {
      const nextRoles = await fetchRoles(nextSession.user.id);
      if (!activeRef.current || currentRequest !== requestIdRef.current) return;
      setRoles(nextRoles);
    } catch (error) {
      if (!activeRef.current || currentRequest !== requestIdRef.current) return;
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Не удалось загрузить права доступа";
      setRolesError(message);
    } finally {
      if (activeRef.current && currentRequest === requestIdRef.current) setLoading(false);
    }
  }, [fetchRoles]);

  useEffect(() => {
    activeRef.current = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setLoading(true);
      // Avoid issuing another Supabase request inside the auth callback itself.
      setTimeout(() => void hydrateSession(s), 0);
    });

    void supabase.auth.getSession().then(({ data }) => hydrateSession(data.session));

    return () => {
      activeRef.current = false;
      requestIdRef.current += 1;
      sub.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const retryRoles = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession?.user) return;
    await hydrateSession(currentSession);
  }, [hydrateSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        rolesError,
        loading,
        isAdmin: roles.includes("admin"),
        isManager: roles.includes("manager"),
        isCatalogEditor: roles.includes("catalog_editor"),
        retryRoles,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
