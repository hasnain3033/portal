import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useOutletContext } from "@remix-run/react";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function AppOverview() {
  const { app } = useOutletContext<{ app: any }>();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  if (!app) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Failed to load app details. Please try refreshing the page.</p>
      </div>
    );
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Use a fixed URL for SSR compatibility, or make it configurable
  const hostedPagesUrl = `http://localhost:3000/hosted/${app.id}`;

  return (
    <div className="space-y-6">
      {/* App Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>App Configuration</CardTitle>
          <CardDescription>Essential configuration for your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Client ID</label>
            <div className="mt-1 flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">{app.clientId}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(app.clientId, 'clientId')}
              >
                {copiedField === 'clientId' ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Redirect URIs</label>
            <div className="mt-1 space-y-2">
              {app.redirectUris?.length > 0 ? (
                app.redirectUris.map((uri: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">{uri}</code>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No redirect URIs configured</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Allowed Origins</label>
            <div className="mt-1 space-y-2">
              {app.allowedOrigins?.length > 0 ? (
                app.allowedOrigins.map((origin: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">{origin}</code>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No allowed origins configured</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hosted Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Hosted Authentication Pages</CardTitle>
          <CardDescription>Pre-built authentication UI for your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Login Page</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs">
                  {hostedPagesUrl}/login
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`${hostedPagesUrl}/login`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Signup Page</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs">
                  {hostedPagesUrl}/signup
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`${hostedPagesUrl}/signup`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Password Reset</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs">
                  {hostedPagesUrl}/reset
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`${hostedPagesUrl}/reset`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Email Verification</h4>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs">
                  {hostedPagesUrl}/verify-email
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`${hostedPagesUrl}/verify-email`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">
              These hosted pages provide a complete authentication flow with your branding.
              Users will be redirected back to your application after authentication.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Integration Guide</CardTitle>
          <CardDescription>Get started with authentication in minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Install the SDK</h4>
            <div className="bg-gray-900 text-gray-100 p-3 rounded">
              <code>npm install @authservice/react</code>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Configure the AuthProvider</h4>
            <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
              <pre>{`import { AuthProvider } from '@authservice/react';

function App() {
  return (
    <AuthProvider 
      clientId="${app.clientId}"
      redirectUri="${app.redirectUris?.[0] || 'http://localhost:3000/callback'}"
    >
      {/* Your app */}
    </AuthProvider>
  );
}`}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Use authentication hooks</h4>
            <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
              <pre>{`import { useAuth } from '@authservice/react';

function LoginButton() {
  const { login, logout, isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div>
        Welcome {user.email}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <button onClick={login}>Login</button>;
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Methods</CardTitle>
          <CardDescription>Available authentication options for your users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email/Password</span>
              <Badge variant="outline" className="bg-green-50">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">OAuth Providers</span>
              <div className="flex gap-2">
                {app.enabledProviders?.length > 0 ? (
                  app.enabledProviders.map((provider: string) => (
                    <Badge key={provider} variant="outline" className="bg-blue-50">
                      {provider}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="bg-surface-background">None configured</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Multi-Factor Authentication</span>
              <Badge variant="outline" className={app.mfaEnabled ? "bg-green-50" : "bg-surface-background"}>
                {app.mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Session Management</span>
              <Badge variant="outline" className="bg-green-50">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}