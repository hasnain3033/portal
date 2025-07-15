import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";
import { getApp, getAppStats } from "~/services/apps.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Users, Settings, Key, BarChart3, Shield } from "lucide-react";
import { AuthenticatedLayout } from "~/components/layout";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const authResult = await requireAuth(request);
  const accessToken = authResult.accessToken;
  const appId = params.appId;
  
  if (!appId) {
    throw new Response("App ID is required", { status: 400 });
  }

  try {
    const [developer, app, stats] = await Promise.all([
      getCurrentDeveloper(accessToken),
      getApp(accessToken, appId),
      getAppStats(accessToken, appId),
    ]);

    return json({ developer, app, stats });
  } catch (error) {
    console.error("Failed to load app details:", error);
    throw new Response("Failed to load app details", { status: 500 });
  }
}

export default function AppDetails() {
  const { app, stats } = useLoaderData<typeof loader>();

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-surface-background">
      <header className="bg-surface-card shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/apps" className="mr-4">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {app.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Client ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{app.clientId}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {app.isActive ? (
                <>
                  <span className="inline-flex h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm font-medium">Active</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm font-medium">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newUsersToday} new today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                Current active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auth Providers</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{app.enabledProviders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                OAuth providers enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MFA Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mfaEnabledUsers}</div>
              <p className="text-xs text-muted-foreground">
                Enhanced security
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <Link to={`/apps/${app.id}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </Link>
            <Link to={`/apps/${app.id}/settings`}>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </Link>
            <Link to={`/apps/${app.id}/users`}>
              <TabsTrigger value="users">Users</TabsTrigger>
            </Link>
            <Link to={`/apps/${app.id}/oauth`}>
              <TabsTrigger value="oauth">OAuth</TabsTrigger>
            </Link>
            <Link to={`/apps/${app.id}/credentials`}>
              <TabsTrigger value="credentials">API Keys</TabsTrigger>
            </Link>
          </TabsList>

          <Outlet context={{ app, stats }} />
        </Tabs>
      </main>
      </div>
    </AuthenticatedLayout>
  );
}