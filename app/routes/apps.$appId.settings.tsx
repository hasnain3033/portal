import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext, useFetcher, useRevalidator } from "@remix-run/react";
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
  const revalidator = useRevalidator();
  // Initialize with existing URIs
  const [redirectUris, setRedirectUris] = useState<string[]>(app.redirectUris || []);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>(app.allowedOrigins || []);
  const [isActive, setIsActive] = useState(app.isActive ?? true);
  const [mfaEnabled, setMfaEnabled] = useState(app.mfaEnabled ?? false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRedirectUriWarning, setShowRedirectUriWarning] = useState(false);

  // Sync state with app data when it changes
  useEffect(() => {
    setRedirectUris(app.redirectUris || []);
    setAllowedOrigins(app.allowedOrigins || []);
    setIsActive(app.isActive ?? true);
    setMfaEnabled(app.mfaEnabled ?? false);
  }, [app]);

  // Auto-dismiss success message after 3 seconds and revalidate data
  useEffect(() => {
    if (fetcher.data?.success && !showSuccess) {
      setShowSuccess(true);
      // Revalidate to get fresh data from the server
      revalidator.revalidate();
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data?.success, showSuccess, revalidator]);

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...redirectUris];
    newUris[index] = value;
    setRedirectUris(newUris);
  };

  const addRedirectUriField = () => {
    setRedirectUris([...redirectUris, ""]);
  };

  const removeRedirectUri = (index: number) => {
    // Don't remove if it's the only non-empty URI
    const nonEmptyUris = redirectUris.filter(uri => uri.trim() !== "");
    if (nonEmptyUris.length <= 1 && redirectUris[index].trim() !== "") {
      setShowRedirectUriWarning(true);
      setTimeout(() => setShowRedirectUriWarning(false), 3000);
      return;
    }
    
    const newUris = redirectUris.filter((_, i) => i !== index);
    setRedirectUris(newUris);
  };

  const updateAllowedOrigin = (index: number, value: string) => {
    const newOrigins = [...allowedOrigins];
    newOrigins[index] = value;
    setAllowedOrigins(newOrigins);
  };

  const addAllowedOriginField = () => {
    setAllowedOrigins([...allowedOrigins, ""]);
  };

  const removeAllowedOrigin = (index: number) => {
    // Don't remove if it's the only non-empty origin
    const nonEmptyOrigins = allowedOrigins.filter(origin => origin.trim() !== "");
    if (nonEmptyOrigins.length <= 1 && allowedOrigins[index].trim() !== "") {
      alert("At least one allowed origin is required");
      return;
    }
    
    const newOrigins = allowedOrigins.filter((_, i) => i !== index);
    setAllowedOrigins(newOrigins);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Filter out empty values
    const validRedirectUris = redirectUris.filter(uri => uri.trim() !== "");
    const validAllowedOrigins = allowedOrigins.filter(origin => origin.trim() !== "");
    
    // Validate that there's at least one redirect URI
    if (validRedirectUris.length === 0) {
      alert("At least one redirect URI is required");
      return;
    }
    
    // Validate that there's at least one allowed origin
    if (validAllowedOrigins.length === 0) {
      alert("At least one allowed origin is required for CORS");
      return;
    }
    
    console.log("Submitting with redirect URIs:", validRedirectUris);
    console.log("Submitting with allowed origins:", validAllowedOrigins);
    
    const formData = new FormData(e.currentTarget);
    formData.set("redirectUris", JSON.stringify(validRedirectUris));
    formData.set("allowedOrigins", JSON.stringify(validAllowedOrigins));
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
            {showRedirectUriWarning && (
              <span className="text-red-500 text-sm block mt-1">
                * At least one redirect URI is required
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {redirectUris.map((uri, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input 
                  value={uri} 
                  onChange={(e) => updateRedirectUri(index, e.target.value)}
                  placeholder="https://myapp.com/callback"
                  className="flex-1" 
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRedirectUri(index)}
                  title="Remove redirect URI"
                  disabled={redirectUris.filter(u => u.trim() !== "").length <= 1 && uri.trim() !== ""}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addRedirectUriField}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Redirect URI
          </Button>
        </CardContent>
      </Card>

      {/* Allowed Origins */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Origins</CardTitle>
          <CardDescription>
            Origins allowed to make requests to your application (CORS). Must be exact URLs without wildcards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {allowedOrigins.map((origin, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input 
                  value={origin} 
                  onChange={(e) => updateAllowedOrigin(index, e.target.value)}
                  placeholder="https://myapp.com"
                  className="flex-1" 
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAllowedOrigin(index)}
                  title="Remove allowed origin"
                  disabled={allowedOrigins.filter(o => o.trim() !== "").length <= 1 && origin.trim() !== ""}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addAllowedOriginField}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allowed Origin
          </Button>
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