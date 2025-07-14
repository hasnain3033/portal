import { useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function AppOverview() {
  const { app } = useLoaderData<{ app: any }>();
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Use these credentials to authenticate your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Client ID</label>
            <div className="flex items-center mt-1 space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                {app.clientId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(app.clientId, 'clientId')}
              >
                {copied === 'clientId' ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Client Secret</label>
            <div className="flex items-center mt-1 space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                {showSecret ? app.clientSecret : '••••••••••••••••••••••••'}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(app.clientSecret, 'clientSecret')}
              >
                {copied === 'clientSecret' ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Keep your client secret secure. Never expose it in client-side code.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with our authentication service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Install the SDK</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              <code>npm install @authservice/core @authservice/react</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Initialize the client</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
              <code>{`import { AuthServiceClient } from '@authservice/core';

const authClient = new AuthServiceClient({
  clientId: '${app.clientId}',
  clientSecret: '${app.clientSecret}',
  apiUrl: '${process.env.AUTH_API_URL || "http://localhost:3000"}'
});`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Use authentication</h4>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
              <code>{`// Sign up a new user
const { user, accessToken } = await authClient.signUp({
  email: 'user@example.com',
  password: 'securepassword'
});

// Login existing user
const { user, accessToken } = await authClient.login({
  email: 'user@example.com',
  password: 'securepassword'
});`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Hosted Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Hosted Authentication Pages</CardTitle>
          <CardDescription>
            Pre-built, customizable authentication pages for your app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Login Page</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {process.env.AUTH_API_URL || "http://localhost:3000"}/hosted/{app.id}/login
              </code>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Sign Up Page</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {process.env.AUTH_API_URL || "http://localhost:3000"}/hosted/{app.id}/signup
              </code>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Password Reset</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {process.env.AUTH_API_URL || "http://localhost:3000"}/hosted/{app.id}/reset
              </code>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Simply redirect users to these URLs and we'll handle the authentication flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}