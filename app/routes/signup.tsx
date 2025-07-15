import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getUserSession } from "~/services/auth.server";
import { apiRequestOrThrow } from "~/services/api.server";
import { useState } from "react";

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
  const confirmPassword = formData.get("confirmPassword");

  if (typeof email !== "string" || typeof password !== "string" || typeof confirmPassword !== "string") {
    return json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }

  try {
    // Register as developer
    const response = await apiRequestOrThrow('/auth/developers/signup', {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // After successful signup, redirect to OTP verification page
    return redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Signup error:", error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      return json(
        { error: "Unable to connect to auth service. Please ensure the auth service is running on port 3000." },
        { status: 503 }
      );
    }
    
    return json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 400 }
    );
  }
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = password === confirmPassword || confirmPassword === "";
  const passwordLengthValid = password.length >= 8 || password === "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-background">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface-card p-8 shadow">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Create Developer Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign up to start building with our authentication service
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-surface-border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {password && !passwordLengthValid && (
              <p className="mt-1 text-sm text-error">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-surface-border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-error">
                Passwords do not match
              </p>
            )}
          </div>

          {actionData?.error && (
            <div className="rounded-md bg-error/10 p-4">
              <p className="text-sm text-error-dark">{actionData.error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !passwordsMatch || !passwordLengthValid}
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </a>
          </div>
        </Form>

        <div className="border-t pt-6">
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-2">What you get with a free account:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>1 application</li>
              <li>100 users per app</li>
              <li>10,000 API requests/month</li>
              <li>Email/password authentication</li>
              <li>Basic support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}