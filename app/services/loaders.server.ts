import { requireAuth, getCurrentDeveloper } from "./auth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * Common loader that ensures developer data is available for the sidebar
 * Use this in all authenticated routes to maintain consistency
 */
export async function requireAuthWithDeveloper(request: Request) {
  const authResult = await requireAuth(request);
  const developer = await getCurrentDeveloper(authResult.accessToken);
  
  return {
    ...authResult,
    developer,
  };
}