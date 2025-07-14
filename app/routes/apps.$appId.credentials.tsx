import { useState } from "react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Copy, Eye, EyeOff, RefreshCw, Key } from "lucide-react";

import { requireAuth } from "~/services/auth.server";
import { apiRequest } from "~/services/api.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const appId = params.appId!;
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "regenerate-secret") {
    // Call API to regenerate client secret
    const response = await apiRequest(`/apps/${appId}/rotate-secret`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    return json({ newSecret: data.clientSecret });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ApiCredentials() {
  const { app } = useLoaderData<{ app: any }>();
  const fetcher = useFetcher();
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const regenerateSecret = () => {
    if (confirm("Are you sure you want to regenerate the client secret? This will invalidate the current secret.")) {
      fetcher.submit(
        { _action: "regenerate-secret" },
        { method: "post" }
      );
    }
  };

  // Check if fetcher has returned new secret
  if (fetcher.data?.newSecret && !newSecret) {
    setNewSecret(fetcher.data.newSecret);
  }

  const displaySecret = newSecret || app.clientSecret;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Use these credentials to authenticate your application with our API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Client ID</label>
              <Badge variant="outline" className="text-xs">Public</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                {app.clientId}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(app.clientId, 'clientId')}
              >
                {copiedField === 'clientId' ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is your public identifier. It's safe to include in client-side code.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Client Secret</label>
              <Badge variant="outline" className="text-xs bg-red-50">Secret</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                {showSecret ? displaySecret : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {showSecret && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(displaySecret, 'clientSecret')}
                >
                  {copiedField === 'clientSecret' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep this secret! Never expose it in client-side code or public repositories.
            </p>
            
            {newSecret && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This is your new client secret. Copy it now as it won't be shown again.
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={regenerateSecret}
              disabled={fetcher.state !== 'idle'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${fetcher.state !== 'idle' ? 'animate-spin' : ''}`} />
              Regenerate Client Secret
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Endpoints</CardTitle>
          <CardDescription>Use these endpoints to implement authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Base URL</h4>
            <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
              {window.location.origin.replace('portal', 'localhost:3000')}/auth
            </code>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-1">User Login</h4>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST /users/login</code>
              <p className="text-xs text-gray-500 mt-1">Authenticate a user with email and password</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">User Signup</h4>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST /users/signup</code>
              <p className="text-xs text-gray-500 mt-1">Create a new user account</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Refresh Token</h4>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST /users/refresh</code>
              <p className="text-xs text-gray-500 mt-1">Refresh an expired access token</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">OAuth Login</h4>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /oauth/:provider?appId={app.id}</code>
              <p className="text-xs text-gray-500 mt-1">Initiate OAuth login flow</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example: Authentication with cURL</CardTitle>
          <CardDescription>Quick example to test your integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
            <pre className="text-sm">{`# User signup
curl -X POST ${window.location.origin.replace('portal', 'localhost:3000')}/auth/users/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "appId": "${app.id}",
    "clientId": "${app.clientId}",
    "clientSecret": "${displaySecret}"
  }'

# User login
curl -X POST ${window.location.origin.replace('portal', 'localhost:3000')}/auth/users/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "appId": "${app.id}",
    "clientId": "${app.clientId}",
    "clientSecret": "${displaySecret}"
  }'`}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SDK Integration</CardTitle>
          <CardDescription>Integrate using our official SDKs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">JavaScript SDK</h4>
              </div>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                npm install @authservice/core
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Core authentication library for JavaScript applications
              </p>
            </div>

            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">React SDK</h4>
              </div>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                npm install @authservice/react
              </code>
              <p className="text-xs text-gray-500 mt-2">
                React hooks and components for authentication
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}