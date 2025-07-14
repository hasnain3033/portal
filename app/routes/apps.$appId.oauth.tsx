import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { requireAuth } from "~/services/auth.server";
import { getOAuthCredentials, updateOAuthCredentials, deleteOAuthCredentials } from "~/services/apps.server";
import { Eye, EyeOff, Trash2, Plus, Check, X } from "lucide-react";

const OAUTH_PROVIDERS = [
  { id: 'google', name: 'Google', icon: '🔍' },
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const appId = params.appId!;
  
  const credentials = await getOAuthCredentials(accessToken, appId);
  
  return json({ credentials, appId });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const appId = params.appId!;
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "update") {
    const provider = formData.get("provider") as string;
    const clientId = formData.get("clientId") as string;
    const clientSecret = formData.get("clientSecret") as string;
    const redirectUri = formData.get("redirectUri") as string;
    
    await updateOAuthCredentials(accessToken, appId, provider, {
      clientId,
      clientSecret,
      redirectUri,
    });
    
    return json({ success: true });
  }
  
  if (action === "delete") {
    const provider = formData.get("provider") as string;
    await deleteOAuthCredentials(accessToken, appId, provider);
    return json({ success: true });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function OAuthSettings() {
  const { credentials, appId } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const toggleSecret = (provider: string) => {
    setShowSecrets(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const startEditing = (provider: string, existing?: any) => {
    setEditingProvider(provider);
    setFormData(existing || { clientId: '', clientSecret: '', redirectUri: '' });
  };

  const cancelEditing = () => {
    setEditingProvider(null);
    setFormData({});
  };

  const saveCredentials = () => {
    if (!editingProvider) return;
    
    fetcher.submit(
      {
        _action: "update",
        provider: editingProvider,
        ...formData,
      },
      { method: "post" }
    );
    
    setEditingProvider(null);
    setFormData({});
  };

  const deleteCredential = (provider: string) => {
    if (confirm(`Are you sure you want to delete ${provider} credentials?`)) {
      fetcher.submit(
        { _action: "delete", provider },
        { method: "post" }
      );
    }
  };

  const getCallbackUrl = (provider: string) => {
    return `${window.location.origin.replace('portal', 'localhost:3000')}/auth/oauth/${provider}/callback?appId=${appId}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Provider Configuration</CardTitle>
          <CardDescription>
            Configure OAuth providers to enable social login for your users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {OAUTH_PROVIDERS.map((provider) => {
              const credential = credentials.find((c: any) => c.provider === provider.id);
              const isEditing = editingProvider === provider.id;
              
              return (
                <div key={provider.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <h3 className="font-medium text-lg">{provider.name}</h3>
                      {credential && !isEditing && (
                        <Badge variant="outline" className="bg-green-50">Configured</Badge>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(provider.id, credential)}
                        >
                          {credential ? 'Edit' : <><Plus className="h-4 w-4 mr-1" />Configure</>}
                        </Button>
                        {credential && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteCredential(provider.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`${provider.id}-clientId`}>Client ID</Label>
                        <Input
                          id={`${provider.id}-clientId`}
                          value={formData.clientId || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                          placeholder="Enter your OAuth client ID"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${provider.id}-clientSecret`}>Client Secret</Label>
                        <Input
                          id={`${provider.id}-clientSecret`}
                          type="password"
                          value={formData.clientSecret || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                          placeholder="Enter your OAuth client secret"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${provider.id}-redirectUri`}>Redirect URI (Optional)</Label>
                        <Input
                          id={`${provider.id}-redirectUri`}
                          value={formData.redirectUri || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, redirectUri: e.target.value }))}
                          placeholder="Custom redirect URI (leave blank for default)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default callback URL: <code className="bg-gray-100 px-1 rounded">{getCallbackUrl(provider.id)}</code>
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveCredentials}>
                          <Check className="h-4 w-4 mr-1" />Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : credential ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Client ID</p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{credential.clientId}</code>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Client Secret</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                            {showSecrets[provider.id] ? credential.clientSecret : '••••••••••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSecret(provider.id)}
                          >
                            {showSecrets[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Callback URL</p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm block overflow-x-auto">
                          {credential.redirectUri || getCallbackUrl(provider.id)}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Not configured. Click Configure to add {provider.name} OAuth credentials.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>OAuth Setup Instructions</CardTitle>
          <CardDescription>How to obtain OAuth credentials from providers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">🔍 Google</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google+ API</li>
              <li>Create OAuth 2.0 credentials</li>
              <li>Add authorized redirect URI</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🐙 GitHub</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://github.com/settings/developers" target="_blank" className="text-blue-600 hover:underline">GitHub Developer Settings</a></li>
              <li>Click "New OAuth App"</li>
              <li>Fill in application details</li>
              <li>Set Authorization callback URL</li>
              <li>Save and copy Client ID and Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}