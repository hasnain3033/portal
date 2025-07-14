import type { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/services/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

// Only allow POST requests
export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}