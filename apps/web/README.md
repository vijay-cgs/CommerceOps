BOOT-002 baseline is in place for the Next.js App Router workspace.

Current baseline includes:

- Root App Router layout, home page, loading boundary, and error boundary.
- Protected route group with inventory placeholder route.
- Tailwind/PostCSS configuration and global styles.
- Temporary development auth context for protected layout gating.

BOOT-005 will replace placeholder auth logic with seeded authentication behavior.

BOOT-005 status:

- Sign-in route: /login
- Registration route: /register
- Session cookie: `co_session` (httpOnly, sameSite=lax, JWT payload)
- The cookie is set by the `/api/auth/login` and `/api/auth/register` proxy routes; the token is never exposed to client JavaScript.
- Protected routes redirect to /login when signed out, and to / when the signed-in role lacks inventory access.
