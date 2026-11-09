// The token check: who may do what. The platform's API doesn't enforce scope, so this is the only place that does.
import { whoami } from "./platform.ts";

export async function requireToken(): Promise<void> {
  await whoami();
}

export async function requireAdmin(): Promise<void> {
  const { scope } = await whoami();
  if (scope !== "admin") throw new Error("Ask for admin token ");
}
