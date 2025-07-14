import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { requireAuth } from "~/services/auth.server";
import { createApp } from "~/services/apps.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const formData = await request.formData();
  
  const name = formData.get("name");
  const description = formData.get("description");

  if (typeof name !== "string" || !name) {
    return json(
      { error: "Application name is required" },
      { status: 400 }
    );
  }

  try {
    const app = await createApp(accessToken, {
      name,
      description: typeof description === "string" ? description : undefined,
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
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
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
                    rows={3}
                    placeholder="A brief description of your application"
                    className="mt-1"
                  />
                </div>

                {actionData?.error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{actionData.error}</p>
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
            <CardContent className="prose prose-sm text-gray-600">
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