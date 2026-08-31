import { redirect } from "next/navigation";
import { getAuthContext } from "../../lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/auth/dev-sign-in");
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold">Protected Workspace</h1>
        <p className="text-sm text-gray-600">Signed in as: {auth.displayName}</p>
        <p className="text-sm text-gray-600">Role: {auth.role}</p>
        <p className="text-sm text-gray-600">Email: {auth.email}</p>
        <a className="mt-3 inline-block text-sm text-blue-700" href="/auth/sign-out">
          Sign out
        </a>
      </header>
      {children}
    </main>
  );
}
