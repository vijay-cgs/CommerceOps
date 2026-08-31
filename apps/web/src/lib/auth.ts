import { cookies } from "next/headers";
import { findSeedUserById } from "./dev-seed-users";

const DEV_AUTH_COOKIE = "co_dev_user";

export type AuthContext = {
  userId: string;
  role: "admin" | "inventory_manager" | "read_only";
  displayName: string;
  email: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(DEV_AUTH_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  const seedUser = findSeedUserById(userId);

  if (!seedUser) {
    return null;
  }

  return {
    userId: seedUser.id,
    role: seedUser.role,
    displayName: seedUser.name,
    email: seedUser.email,
  };
}

export const DEV_AUTH_COOKIE_NAME = DEV_AUTH_COOKIE;
