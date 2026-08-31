import bcrypt from "bcryptjs";
import { prismaClient } from "../prisma/prisma.client";
import { signSessionToken, type UserRole } from "./jwt";

const BCRYPT_ROUNDS = 12;

// Compared against when an account is missing so login timing does not reveal
// whether an email is registered.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO3Zx8yPZ8N8DTbY1uH1p3xZ5nWpQm5Iu";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthResult = {
  user: PublicUser;
  token: string;
};

export class EmailAlreadyRegisteredError extends Error {}
export class InvalidCredentialsError extends Error {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assessPasswordStrength(password: string): string | null {
  if (password.length < 10) {
    return "Password must be at least 10 characters long";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Password must include both uppercase and lowercase letters";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  return null;
}

async function issueSession(user: PublicUser): Promise<AuthResult> {
  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return { user, token };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const existing = await prismaClient.user.findUnique({ where: { email } });

  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Self-registration always creates a customer; elevated roles are assigned out of band.
  const created = await prismaClient.user.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash,
      role: "customer",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return issueSession(created as PublicUser);
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const user = await prismaClient.user.findUnique({ where: { email } });

  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return issueSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });
}
