import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { loginDeveloper, createUserSession, getUserSession } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getUserSession(request);
  if (session.has("accessToken")) {
    // Already logged in
    return redirect("/dashboard");
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Login as developer - we need the raw response to forward cookies
    const { data, cookies } = await loginDeveloper(email, password);

    if (data.requiresMfa) {
      // TODO: Handle MFA flow
      return json(
        { error: "MFA required - not yet implemented" },
        { status: 400 }
      );
    }

    // Create session and forward backend cookies
    return createUserSession(
      data.access_token,
      "/dashboard",
      cookies // Forward the backend cookies including refresh_token
    );
  } catch (error) {
    console.error("Login error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 }
    );
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-background">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface-card p-8 shadow">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Developer Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to manage your applications
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-surface-border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-surface-border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          {actionData?.error && (
            <div className="rounded-md bg-error/10 p-4">
              <p className="text-sm text-error-dark">{actionData.error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <a
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}