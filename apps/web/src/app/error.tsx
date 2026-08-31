"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-4xl p-8" role="alert">
      <h2 className="text-2xl font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-gray-700">{error.message}</p>
      <button
        className="mt-4 rounded bg-red-700 px-4 py-2 text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
