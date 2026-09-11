import { getSessionUser } from "../../../web/src/lib/auth";

// The zone renders standalone during migration, where the shell session secret may be absent.
export async function safeSessionUser() {
  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}
