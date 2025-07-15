import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";
import { getApps } from "~/services/apps.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Users, Key, Settings, Box } from "lucide-react";
import { AuthenticatedLayout } from "~/components/layout";
import { EmptyState } from "~/components/ui/EmptyState";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  
  const [developer, apps] = await Promise.all([
    getCurrentDeveloper(accessToken),
    getApps(accessToken)
  ]);
  
  return json({ developer, apps });
}

export default function Apps() {
  const { apps } = useLoaderData<typeof loader>();

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your authentication applications
            </p>
          </div>
          <Link to="/apps/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New App
            </Button>
          </Link>
        </div>

        {/* Apps Grid */}
        <div>
        {apps.length === 0 ? (
          <EmptyState
            icon={<Box className="h-12 w-12" />}
            title="No applications yet"
            description="Create your first application to start authenticating users"
            action={{
              label: "Create Your First App",
              href: "/apps/new"
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{app.name}</CardTitle>
                  <CardDescription>
                    Created {new Date(app.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <Users className="mr-2 h-4 w-4" />
                        {app._count?.users || 0} users
                      </span>
                      <span className="flex items-center text-gray-500">
                        <Key className="mr-2 h-4 w-4" />
                        {app.enabledProviders?.length || 0} providers
                      </span>
                    </div>
                    
                    <div className="border-t pt-4 flex items-center justify-between">
                      <Link to={`/apps/${app.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                      <div className="flex items-center space-x-2">
                        {app.isActive ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-success" />
                        ) : (
                          <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {app.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}