import { DEV_AUTH_COOKIE_NAME } from "../../../lib/auth";
import { DEV_SEED_USERS } from "../../../lib/dev-seed-users";

export default function DevSignInPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Development Sign-In</h1>
      <p className="mt-2 text-gray-700">
        Choose a seeded user to enter protected routes and exercise role-aware behavior.
      </p>
      <ul className="mt-6 space-y-3">
        {DEV_SEED_USERS.map((user) => (
          <li className="rounded border border-gray-200 p-4" key={user.id}>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">Role: {user.role}</p>
            <a
              className="mt-3 inline-block rounded bg-gray-900 px-3 py-2 text-sm text-white"
              href={`/auth/dev-sign-in/session?userId=${user.id}`}
            >
              Sign in
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-gray-600">Session cookie: {DEV_AUTH_COOKIE_NAME}</p>
    </main>
  );
}
