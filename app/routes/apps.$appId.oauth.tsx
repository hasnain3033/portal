import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useOutletContext } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { requireAuth } from "~/services/auth.server";
import { getOAuthCredentials, createOAuthCredentials, updateOAuthCredentials, deleteOAuthCredentials } from "~/services/apps.server";
import { Eye, EyeOff, Trash2, Plus, Check, X, Globe, Github } from "lucide-react";

// Match the backend OAuthProvider enum
const OAUTH_PROVIDERS = [
  { id: 'google', name: 'Google', icon: <Globe className="h-5 w-5 text-primary-600" /> },
  { id: 'github', name: 'GitHub', icon: <Github className="h-5 w-5 text-gray-800" /> },
  { id: 'microsoft', name: 'Microsoft', icon: '🪟' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'apple', name: 'Apple', icon: '🍎' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
];

// Default scopes for each provider
const DEFAULT_SCOPES = {
  google: ['email', 'profile'],
  github: ['user:email', 'read:user'],
  microsoft: ['openid', 'profile', 'email'],
  facebook: ['email', 'public_profile'],
  apple: ['email', 'name'],
  linkedin: ['r_emailaddress', 'r_liteprofile'],
  twitter: ['tweet.read', 'users.read'],
};

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
  
  if (action === "create") {
    const provider = formData.get("provider") as string;
    const clientId = formData.get("clientId") as string;
    const clientSecret = formData.get("clientSecret") as string;
    const callbackUrl = formData.get("callbackUrl") as string;
    const isEnabled = formData.get("isEnabled") === "true";
    const scopesStr = formData.get("scopes") as string;
    const scopes = scopesStr ? scopesStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    
    await createOAuthCredentials(accessToken, appId, {
      provider,
      clientId,
      clientSecret,
      callbackUrl: callbackUrl || undefined,
      scopes,
      isEnabled,
    });
    
    return json({ success: true });
  }
  
  if (action === "update") {
    const provider = formData.get("provider") as string;
    const clientId = formData.get("clientId") as string;
    const clientSecret = formData.get("clientSecret") as string;
    const callbackUrl = formData.get("callbackUrl") as string;
    const isEnabled = formData.get("isEnabled") === "true";
    const scopesStr = formData.get("scopes") as string;
    const scopes = scopesStr ? scopesStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    
    await updateOAuthCredentials(accessToken, appId, provider, {
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
      callbackUrl: callbackUrl || undefined,
      scopes,
      isEnabled,
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
  const { app } = useOutletContext<{ app: any }>();
  const { credentials, appId } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scopes: string;
    isEnabled: boolean;
  }>({
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    scopes: '',
    isEnabled: true,
  });

  const toggleSecret = (provider: string) => {
    setShowSecrets(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const startEditing = (provider: string, existing?: any) => {
    setEditingProvider(provider);
    if (existing) {
      setFormData({
        clientId: existing.clientId || '',
        clientSecret: '', // Never populate existing secret
        callbackUrl: existing.callbackUrl || '',
        scopes: existing.scopes?.join(', ') || '',
        isEnabled: existing.isEnabled ?? true,
      });
    } else {
      const defaultScopes = DEFAULT_SCOPES[provider as keyof typeof DEFAULT_SCOPES] || [];
      setFormData({
        clientId: '',
        clientSecret: '',
        callbackUrl: '',
        scopes: defaultScopes.join(', '),
        isEnabled: true,
      });
    }
  };

  const cancelEditing = () => {
    setEditingProvider(null);
    setFormData({
      clientId: '',
      clientSecret: '',
      callbackUrl: '',
      scopes: '',
      isEnabled: true,
    });
  };

  const saveCredentials = () => {
    if (!editingProvider) return;
    
    const isNewCredential = !credentials.find((c: any) => c.provider === editingProvider);
    
    fetcher.submit(
      {
        _action: isNewCredential ? "create" : "update",
        provider: editingProvider,
        ...formData,
        isEnabled: formData.isEnabled.toString(),
      },
      { method: "post" }
    );
    
    setEditingProvider(null);
    setFormData({
      clientId: '',
      clientSecret: '',
      callbackUrl: '',
      scopes: '',
      isEnabled: true,
    });
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
    return `http://localhost:3000/auth/oauth/${provider}/callback?appId=${appId}`;
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
                        <Badge 
                          variant={credential.isEnabled ? "outline" : "secondary"} 
                          className={credential.isEnabled ? "bg-success/10" : ""}
                        >
                          {credential.isEnabled ? "Configured" : "Disabled"}
                        </Badge>
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
                            className="text-error hover:text-red-700"
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
                          value={formData.clientId}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                          placeholder="Enter your OAuth client ID"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${provider.id}-clientSecret`}>Client Secret</Label>
                        <Input
                          id={`${provider.id}-clientSecret`}
                          type="password"
                          value={formData.clientSecret}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                          placeholder={credential ? "Leave blank to keep existing secret" : "Enter your OAuth client secret"}
                          required={!credential}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${provider.id}-callbackUrl`}>Callback URL (Optional)</Label>
                        <Input
                          id={`${provider.id}-callbackUrl`}
                          value={formData.callbackUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, callbackUrl: e.target.value }))}
                          placeholder="Custom callback URL (leave blank for default)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default callback URL: <code className="bg-gray-100 px-1 rounded">{getCallbackUrl(provider.id)}</code>
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor={`${provider.id}-scopes`}>OAuth Scopes</Label>
                        <Input
                          id={`${provider.id}-scopes`}
                          value={formData.scopes}
                          onChange={(e) => setFormData(prev => ({ ...prev, scopes: e.target.value }))}
                          placeholder="e.g., email, profile (comma-separated)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Comma-separated list of scopes to request from the OAuth provider
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${provider.id}-enabled`}
                          checked={formData.isEnabled}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                        />
                        <Label htmlFor={`${provider.id}-enabled`}>
                          Enable this OAuth provider
                        </Label>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={saveCredentials}
                          disabled={!formData.clientId || (!credential && !formData.clientSecret)}
                        >
                          <Check className="h-4 w-4 mr-1" />Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : credential ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={credential.isEnabled ? "default" : "secondary"}>
                          {credential.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Client ID</p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{credential.clientId}</code>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Client Secret</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                            ••••••••••••••••
                          </code>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Callback URL</p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm block overflow-x-auto">
                          {credential.callbackUrl || getCallbackUrl(provider.id)}
                        </code>
                      </div>
                      
                      {credential.scopes && credential.scopes.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">OAuth Scopes</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {credential.scopes.map((scope: string) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
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
            <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-primary-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google+ API</li>
              <li>Create OAuth 2.0 credentials</li>
              <li>Add authorized redirect URI</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🐙 GitHub</h4>
            <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://github.com/settings/developers" target="_blank" className="text-primary-600 hover:underline">GitHub Developer Settings</a></li>
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