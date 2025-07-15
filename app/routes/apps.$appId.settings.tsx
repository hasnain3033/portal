import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext, useFetcher } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { requireAuth } from "~/services/auth.server";
import { updateApp } from "~/services/apps.server";
import { useState, useEffect } from "react";
import { Save, Plus, X } from "lucide-react";

export async function action({ request, params }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const appId = params.appId!;
  const formData = await request.formData();
  
  const updates = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    redirectUris: JSON.parse(formData.get("redirectUris") as string || "[]"),
    allowedOrigins: JSON.parse(formData.get("allowedOrigins") as string || "[]"),
    isActive: formData.get("isActive") === "true",
    mfaEnabled: formData.get("mfaEnabled") === "true",
  };
  
  await updateApp(accessToken, appId, updates);
  
  return json({ success: true });
}

export default function AppSettings() {
  const { app } = useOutletContext<{ app: any }>();
  const fetcher = useFetcher();
  const [redirectUris, setRedirectUris] = useState<string[]>(app.redirectUris || []);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>(app.allowedOrigins || []);
  const [newRedirectUri, setNewRedirectUri] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [isActive, setIsActive] = useState(app.isActive ?? true);
  const [mfaEnabled, setMfaEnabled] = useState(app.mfaEnabled ?? false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (fetcher.data?.success && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data?.success, showSuccess]);

  const addRedirectUri = () => {
    if (newRedirectUri && !redirectUris.includes(newRedirectUri)) {
      setRedirectUris([...redirectUris, newRedirectUri]);
      setNewRedirectUri("");
    }
  };

  const removeRedirectUri = (uri: string) => {
    setRedirectUris(redirectUris.filter(u => u !== uri));
  };

  const addOrigin = () => {
    if (newOrigin && !allowedOrigins.includes(newOrigin)) {
      setAllowedOrigins([...allowedOrigins, newOrigin]);
      setNewOrigin("");
    }
  };

  const removeOrigin = (origin: string) => {
    setAllowedOrigins(allowedOrigins.filter(o => o !== origin));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("redirectUris", JSON.stringify(redirectUris));
    formData.set("allowedOrigins", JSON.stringify(allowedOrigins));
    formData.set("isActive", isActive.toString());
    formData.set("mfaEnabled", mfaEnabled.toString());
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <fetcher.Form method="post" onSubmit={handleSubmit} className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic configuration for your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Application Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={app.name}
              required
              placeholder="My Awesome App"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={app.description}
              placeholder="Describe your application..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Application Status</Label>
              <p className="text-sm text-gray-500">Disable to prevent new logins</p>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Configure security features for your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mfaEnabled">Multi-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Allow users to enable 2FA for their accounts</p>
            </div>
            <Switch
              id="mfaEnabled"
              name="mfaEnabled"
              checked={mfaEnabled}
              onCheckedChange={setMfaEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Redirect URIs */}
      <Card>
        <CardHeader>
          <CardTitle>Redirect URIs</CardTitle>
          <CardDescription>
            Allowed redirect URIs for OAuth flows. Must be exact matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {redirectUris.map((uri, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={uri} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRedirectUri(uri)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://myapp.com/callback"
              value={newRedirectUri}
              onChange={(e) => setNewRedirectUri(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRedirectUri())}
            />
            <Button type="button" onClick={addRedirectUri}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Origins */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Origins</CardTitle>
          <CardDescription>
            Origins allowed to make requests to your application (CORS)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {allowedOrigins.map((origin, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={origin} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOrigin(origin)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://myapp.com"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigin())}
            />
            <Button type="button" onClick={addOrigin}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={fetcher.state !== 'idle'}>
          <Save className="h-4 w-4 mr-2" />
          {fetcher.state !== 'idle' ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 p-4 rounded transition-opacity duration-300">
          <p className="text-green-800">Settings saved successfully!</p>
        </div>
      )}
    </fetcher.Form>
  );
}