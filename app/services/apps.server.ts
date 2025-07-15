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
    const errorText = await response.text();
    console.error(`Failed to get app ${appId}:`, response.status, errorText);
    throw new Error(`Failed to get app: ${response.status}`);
  }

  return response.json();
}

export async function createApp(accessToken: string, data: { 
  name: string; 
  redirectUris: string[];
  webhookUrl?: string;
}) {
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

export async function updateApp(accessToken: string, appId: string, data: { 
  name?: string; 
  description?: string; 
  isActive?: boolean;
  redirectUris?: string[];
  allowedOrigins?: string[];
  mfaEnabled?: boolean;
}) {
  const response = await apiRequest(`/apps/${appId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to update app ${appId}:`, response.status, errorText);
    let errorMessage = "Failed to update app";
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // If not JSON, use the text
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`${errorMessage} (Status: ${response.status})`);
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
    const errorText = await response.text();
    console.error(`Failed to get app stats for ${appId}:`, response.status, errorText);
    throw new Error(`Failed to get app stats: ${response.status}`);
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

export async function getOAuthCredentialsByProvider(accessToken: string, appId: string, provider: string) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials/${provider}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to get OAuth credentials");
  }

  return response.json();
}

export async function createOAuthCredentials(
  accessToken: string, 
  appId: string, 
  data: {
    provider: string;
    clientId: string;
    clientSecret: string;
    callbackUrl?: string;
    scopes?: string[];
    isEnabled?: boolean;
    settings?: Record<string, any>;
  }
) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create OAuth credentials");
  }

  return response.json();
}

export async function updateOAuthCredentials(
  accessToken: string, 
  appId: string, 
  provider: string,
  data: {
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
    scopes?: string[];
    isEnabled?: boolean;
    settings?: Record<string, any>;
  }
) {
  const response = await apiRequest(`/apps/${appId}/oauth-credentials/${provider}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
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