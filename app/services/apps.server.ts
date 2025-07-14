import { apiRequest } from "./api.server";

export async function getApps(accessToken: string) {
  const response = await apiRequest('/apps', {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get apps");
  }

  return response.json();
}

export async function getApp(accessToken: string, appId: string) {
  const response = await apiRequest(`/apps/${appId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get app");
  }

  return response.json();
}

export async function createApp(accessToken: string, data: { name: string; description?: string }) {
  const response = await apiRequest('/apps', {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create app");
  }

  return response.json();
}

export async function updateApp(accessToken: string, appId: string, data: { name?: string; description?: string; isActive?: boolean }) {
  const response = await apiRequest(`/apps/${appId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update app");
  }

  return response.json();
}

export async function getAppStats(accessToken: string, appId: string) {
  const response = await apiRequest(`/analytics/apps/${appId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get app stats");
  }

  return response.json();
}

// OAuth credentials management
export async function getOAuthCredentials(accessToken: string, appId: string) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get OAuth credentials");
  }

  return response.json();
}

export async function updateOAuthCredentials(
  accessToken: string, 
  appId: string, 
  provider: string,
  data: { clientId: string; clientSecret: string; redirectUri?: string }
) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      provider,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update OAuth credentials");
  }

  return response.json();
}

export async function deleteOAuthCredentials(accessToken: string, appId: string, provider: string) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials/${provider}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete OAuth credentials");
  }

  return response.json();
}