declare namespace Express {
  interface AuthContext {
    userId: string;
    role: "admin" | "inventory_manager" | "read_only" | "customer";
    email: string;
    name: string;
  }

  interface Request {
    correlationId?: string;
    authContext?: AuthContext;
  }
}
