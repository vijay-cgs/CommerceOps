BOOT-002 baseline is in place for the Next.js App Router workspace.

Current baseline includes:
- Root App Router layout, home page, loading boundary, and error boundary.
- Protected route group with inventory placeholder route.
- Tailwind/PostCSS configuration and global styles.
- Temporary development auth context for protected layout gating.

BOOT-005 will replace placeholder auth logic with seeded authentication behavior.

BOOT-005 status:
- Dev sign-in route: /auth/dev-sign-in
- Session cookie: co_dev_user
- Seeded users include admin, inventory manager, and read-only roles
- Protected routes redirect to dev sign-in when no seed session exists
