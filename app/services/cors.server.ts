import { apiRequest } from './api.server';

export async function getAppCorsSettings(appId: string) {
  const response = await apiRequest(`/public/apps/${appId}/cors-settings`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CORS settings: ${response.statusText}`);
  }
  
  return response.json();
}