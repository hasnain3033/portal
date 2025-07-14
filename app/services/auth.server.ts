import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { apiRequest, apiRequestOrThrow } from "./api.server";

// The portal uses server-side authentication with cookies
// The SDK is designed for app users, not for the developer portal
export async function loginDeveloper(email: string, password: string) {
  const response = await apiRequest('/auth/developers/login', {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${errorText}`);
  }

  // Get all cookies from the backend response
  const setCookieHeader = response.headers.get('set-cookie');
  const cookies = setCookieHeader ? [setCookieHeader] : [];

  const data = await response.json();
  return { data, cookies };
}

// Get current developer info
export async function getCurrentDeveloper(accessToken: string) {
  const response = await apiRequest('/developers/me', {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to get developer info: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to get developer info: ${response.status}`);
  }

  return response.json();
}

// Call our analytics endpoint
export async function getDashboardStats(accessToken: string) {
  const response = await apiRequest('/analytics/dashboard', {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to get dashboard stats: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to get dashboard stats: ${response.status}`);
  }

  return response.json();
}

import { ENV } from './env.server';

// Session management
const sessionSecret = ENV.SESSION_SECRET;

export const storage = createCookieSessionStorage({
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
  
  console.log("requireAuth - Token present:", accessToken ? "Yes" : "No");
  
  if (!accessToken) {
    throw redirect("/login");
  }

  // TODO: Verify token is still valid
  
  return { accessToken, session };
}

export async function createUserSession(
  accessToken: string,
  redirectTo: string,
  backendCookies?: string[]
) {
  const session = await storage.getSession();
  session.set("accessToken", accessToken);
  
  console.log("Creating user session with token:", accessToken ? "Token present" : "No token");
  
  // Prepare headers with both our session cookie and backend cookies
  const headers = new Headers();
  
  // Add our session cookie
  headers.append("Set-Cookie", await storage.commitSession(session));
  
  // Forward backend cookies (including refresh_token)
  if (backendCookies && backendCookies.length > 0) {
    backendCookies.forEach(cookie => {
      headers.append("Set-Cookie", cookie);
    });
  }
  
  return redirect(redirectTo, { headers });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  
  // Clear both our session and the refresh_token cookie
  const headers = new Headers();
  
  // Clear our session
  headers.append("Set-Cookie", await storage.destroySession(session));
  
  // Clear the refresh_token cookie by setting it with Max-Age=0
  headers.append("Set-Cookie", "refresh_token=; Path=/; Max-Age=0; HttpOnly");
  
  return redirect("/login", { headers });
}

// Refresh access token using the refresh token cookie
export async function refreshAccessToken(request: Request): Promise<string | null> {
  try {
    // Forward all cookies from the client request to the backend
    // This includes the refresh_token cookie set by the backend
    const cookieHeader = request.headers.get("Cookie");
    
    if (!cookieHeader) {
      console.log("No cookies found in request");
      return null;
    }
    
    const response = await apiRequest('/auth/developers/refresh', {
      method: "POST",
      headers: {
        // Forward all cookies including refresh_token
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      console.log(`Token refresh failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

// Make authenticated API request with automatic token refresh
export async function apiRequestWithAuth(
  path: string,
  accessToken: string,
  options: RequestInit = {},
  request?: Request
): Promise<Response> {
  // First attempt with current access token
  let response = await apiRequest(path, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  // If unauthorized and we have a request object, try to refresh ONCE
  if (response.status === 401 && request) {
    console.log("Access token expired, attempting refresh...");
    const newAccessToken = await refreshAccessToken(request);
    
    if (newAccessToken) {
      // Update session with new token
      const session = await getUserSession(request);
      session.set("accessToken", newAccessToken);
      
      // Retry the request with new token
      response = await apiRequest(path, {
        ...options,
        headers: {
          ...options.headers,
          "Authorization": `Bearer ${newAccessToken}`,
        },
      });
      
      // If still 401, don't retry again - let caller handle it
    }
  }

  return response;
}