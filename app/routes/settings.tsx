import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";
import { apiRequest } from "~/services/api.server";
import { AuthenticatedLayout } from "~/components/layout";
import { User, Mail, Shield, Key, Bell, AlertCircle, CreditCard } from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const developer = await getCurrentDeveloper(accessToken);
  
  return json({ developer });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "updateProfile") {
    // TODO: Implement profile update
    return json({ success: "Profile updated successfully" });
  }
  
  if (action === "changePassword") {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    
    try {
      const response = await apiRequest('/developers/change-password', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      // Error handling is done by apiRequest
      
      return json({ success: "Password changed successfully" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to change password" },
        { status: 400 }
      );
    }
  }
  
  if (action === "enableMfa") {
    // Navigate to MFA setup
    return json({ mfaSetup: true });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Settings() {
  const { developer } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-surface-background">
        <header className="bg-surface-card shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Account Settings
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <fetcher.Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="updateProfile" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={developer.email}
                          disabled
                          className="bg-surface-background"
                        />
                        {developer.emailVerified && (
                          <Badge variant="outline" className="bg-green-50">
                            <Mail className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="developerId">Developer ID</Label>
                      <Input
                        id="developerId"
                        value={developer.id}
                        disabled
                        className="bg-surface-background font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="createdAt">Member Since</Label>
                    <Input
                      id="createdAt"
                      value={new Date(developer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      disabled
                      className="bg-surface-background"
                    />
                  </div>
                  
                  {fetcher.data?.success && fetcher.data._action === "updateProfile" && (
                    <div className="rounded-md bg-green-50 p-4">
                      <p className="text-sm text-green-800">{fetcher.data.success}</p>
                    </div>
                  )}
                </fetcher.Form>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Change */}
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-gray-500">Change your password regularly to keep your account secure</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                  
                  {showPasswordForm && (
                    <fetcher.Form method="post" className="mt-4 space-y-4 border-t pt-4">
                      <input type="hidden" name="_action" value="changePassword" />
                      
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                          minLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must be at least 8 characters long
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit" disabled={fetcher.state !== 'idle'}>
                          {fetcher.state !== 'idle' ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      {fetcher.data?.error && fetcher.data._action === "changePassword" && (
                        <div className="rounded-md bg-error/10 p-4">
                          <p className="text-sm text-error-dark">{fetcher.data.error}</p>
                        </div>
                      )}
                      
                      {fetcher.data?.success && fetcher.data._action === "changePassword" && (
                        <div className="rounded-md bg-green-50 p-4">
                          <p className="text-sm text-green-800">{fetcher.data.success}</p>
                        </div>
                      )}
                    </fetcher.Form>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    {developer.mfaEnabled ? (
                      <Badge variant="outline" className="bg-green-50">
                        <Shield className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <fetcher.Form method="post">
                        <input type="hidden" name="_action" value="enableMfa" />
                        <Button variant="outline" type="submit">
                          <Shield className="h-4 w-4 mr-2" />
                          Enable 2FA
                        </Button>
                      </fetcher.Form>
                    )}
                  </div>
                </div>

                {/* Login Sessions */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-gray-500">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline">
                      View Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Information */}
            <Card>
              <CardHeader>
                <CardTitle>Plan & Billing</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{developer.plan} Plan</h3>
                      <Badge variant="outline" className="bg-blue-50">Active</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {developer.plan === 'FREE' 
                        ? 'Using the free tier with basic features'
                        : `Subscribed since ${new Date(developer.createdAt).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <a href="/billing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Billing
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what emails you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified about important security events</p>
                  </div>
                  <Switch id="security-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="usage-alerts">Usage Alerts</Label>
                    <p className="text-sm text-gray-500">Notifications when approaching plan limits</p>
                  </div>
                  <Switch id="usage-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="product-updates">Product Updates</Label>
                    <p className="text-sm text-gray-500">New features and improvements</p>
                  </div>
                  <Switch id="product-updates" />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-error">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-gray-500">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-error hover:bg-error/10">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}