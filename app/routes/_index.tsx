import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { requireAuth } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // If user is authenticated, redirect to dashboard
    await requireAuth(request);
    return redirect("/dashboard");
  } catch {
    // If not authenticated, redirect to login
    return redirect("/login");
  }
}

export default function Index() {
  return null;
}