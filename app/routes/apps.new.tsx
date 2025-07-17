import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link, useLoaderData } from "@remix-run/react";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";
import { createApp } from "~/services/apps.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const developer = await getCurrentDeveloper(accessToken);
  
  return json({ developer });
}

export async function action({ request }: ActionFunctionArgs) {
  const authResult = await requireAuth(request);
  const accessToken = authResult.accessToken;
  const formData = await request.formData();
  
  const name = formData.get("name");
  const description = formData.get("description");
  const redirectUri = formData.get("redirectUri");
  const webhookUrl = formData.get("webhookUrl");

  if (typeof name !== "string" || !name) {
    return json(
      { error: "Application name is required" },
      { status: 400 }
    );
  }

  if (typeof redirectUri !== "string" || !redirectUri) {
    return json(
      { error: "Redirect URI is required" },
      { status: 400 }
    );
  }

  // Validate URL format
  try {
    new URL(redirectUri);
  } catch {
    return json(
      { error: "Invalid redirect URI format" },
      { status: 400 }
    );
  }

  if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.trim()) {
    try {
      new URL(webhookUrl);
    } catch {
      return json(
        { error: "Invalid webhook URL format" },
        { status: 400 }
      );
    }
  }

  try {
    const app = await createApp(accessToken, {
      name,
      description: description && typeof description === "string" ? description : undefined,
      redirectUris: [redirectUri],
      webhookUrl: webhookUrl && typeof webhookUrl === "string" && webhookUrl.trim() ? webhookUrl : undefined,
    });

    return redirect(`/apps/${app.id}`);
  } catch (error) {
    console.error("Create app error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to create application" },
      { status: 400 }
    );
  }
}

export default function NewApp() {
  const { developer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-surface-background">
      <header className="bg-surface-card shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link to="/apps" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Create New Application
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>
                Create a new application to manage user authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-6">
                <div>
                  <Label htmlFor="name">Application Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="My Awesome App"
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This name will be displayed to your users
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your application..."
                    className="mt-1"
                    rows={3}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    A brief description of your application
                  </p>
                </div>

                <div>
                  <Label htmlFor="redirectUri">Redirect URI</Label>
                  <Input
                    id="redirectUri"
                    name="redirectUri"
                    type="url"
                    required
                    placeholder="https://myapp.com/callback"
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The URL where users will be redirected after authentication
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                  <Input
                    id="webhookUrl"
                    name="webhookUrl"
                    type="url"
                    placeholder="https://myapp.com/webhooks"
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    URL to receive events like user.created, user.deleted, session.revoked
                  </p>
                </div>

                {actionData?.error && (
                  <div className="rounded-md bg-error/10 p-4">
                    <p className="text-sm text-error-dark">{actionData.error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Application"}
                  </Button>
                  <Link to="/apps">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-gray-500">
              <ul>
                <li>You'll receive API credentials for your application</li>
                <li>Configure authentication providers (email/password, OAuth)</li>
                <li>Integrate our SDK into your application</li>
                <li>Start authenticating users!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}