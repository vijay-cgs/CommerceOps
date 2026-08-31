"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "../../lib/auth";

const AuthUserContext = createContext<SessionUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser(): SessionUser | null {
  return useContext(AuthUserContext);
}
