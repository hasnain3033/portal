import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAuth } from "~/services/auth.server";
import { getApps } from "~/services/apps.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Users, Key, Settings } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const apps = await getApps(accessToken);
  
  return json({ apps });
}

export default function Apps() {
  const { apps } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Applications
            </h1>
            <Link to="/apps/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {apps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-gray-500 mb-4">
                You haven't created any applications yet.
              </p>
              <Link to="/apps/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First App
                </Button>
              </Link>
            </CardContent>
          </Card>
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
                        <span className={`inline-flex h-2 w-2 rounded-full ${
                          app.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
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
      </main>
    </div>
  );
}