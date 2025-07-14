// Server-side environment configuration
// Using Vite's environment variable handling

// For server-side code in Remix, we need to use process.env
// import.meta.env is only available in client-side code
export const ENV = {
  AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000',
  PORTAL_URL: import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173',
  SESSION_SECRET: import.meta.env.SESSION_SECRET || 'default-dev-secret',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
};

// Validate required environment variables
if (!ENV.SESSION_SECRET || ENV.SESSION_SECRET === 'default-dev-secret') {
  console.warn('Warning: Using default SESSION_SECRET. Please set a secure value in production.');
}

export function getAuthApiUrl(): string {
  return ENV.AUTH_API_URL;
}

// For client-side usage
export function getClientEnv() {
  return {
    AUTH_API_URL: ENV.AUTH_API_URL,
    PORTAL_URL: ENV.PORTAL_URL,
  };
}