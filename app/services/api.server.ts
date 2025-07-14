import { getAuthApiUrl } from './env.server';

// API utility for server-side requests
export function getApiUrl(path: string): string {
  const baseUrl = getAuthApiUrl();
  console.log(`Making API request to: ${baseUrl}${path}`);
  return `${baseUrl}${path}`;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const url = getApiUrl(path);

  console.log(`API Request: ${url}`, options);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Return response directly for auth handling
    return response;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    if (error instanceof TypeError && error.cause) {
      console.error('Cause:', error.cause);
    }
    throw error;
  }
}

export async function apiRequestOrThrow(path: string, options: RequestInit = {}) {
  const response = await apiRequest(path, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed with status ${response.status}: ${errorText}`);
    throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
  }
  
  return response;
}