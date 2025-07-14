import { AuthServiceClient } from "@authservice/core";
import { createCookieSessionStorage, redirect } from "@remix-run/node";

// Since we're using the SDK in a server environment, we need a custom storage adapter
class ServerStorageAdapter {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

// Since the portal is for developers, we need to use the developer auth endpoints directly
// The SDK is designed for app users, not developers
export async function loginDeveloper(email: string, password: string) {
  const response = await fetch(`${process.env.AUTH_API_URL || "http://localhost:3000"}/auth/developers/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}

// Get current developer info
export async function getCurrentDeveloper(accessToken: string) {
  const response = await fetch(`${process.env.AUTH_API_URL || "http://localhost:3000"}/developers/me`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get developer info");
  }

  return response.json();
}

// Call our analytics endpoint
export async function getDashboardStats(accessToken: string) {
  const response = await fetch(`${process.env.AUTH_API_URL || "http://localhost:3000"}/analytics/dashboard`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get dashboard stats");
  }

  return response.json();
}

// Session management
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "portal_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function requireAuth(request: Request) {
  const session = await getUserSession(request);
  const accessToken = session.get("accessToken");
  
  if (!accessToken) {
    throw redirect("/login");
  }

  // TODO: Verify token is still valid
  
  return { accessToken, session };
}

export async function createUserSession(
  accessToken: string,
  refreshToken: string,
  redirectTo: string
) {
  const session = await storage.getSession();
  session.set("accessToken", accessToken);
  session.set("refreshToken", refreshToken);
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  
  // TODO: Call logout endpoint on auth service
  
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}