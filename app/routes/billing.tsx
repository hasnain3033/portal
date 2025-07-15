import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";
import { apiRequest } from "~/services/api.server";
import { Check, X, Zap, CreditCard, ExternalLink } from "lucide-react";
import { AuthenticatedLayout } from "~/components/layout";

const PLANS = [
  {
    name: 'FREE',
    price: '$0',
    description: 'Perfect for trying out our service',
    features: [
      '1 application',
      '100 users per app',
      '10,000 API requests/month',
      'Email/password auth',
      'Basic support'
    ],
    limits: {
      apps: 1,
      usersPerApp: 100,
      requestsPerMonth: 10000
    }
  },
  {
    name: 'STARTER',
    price: '$29',
    priceId: 'price_starter', // This would be from Stripe
    description: 'Great for small projects',
    features: [
      '3 applications',
      '1,000 users per app',
      '100,000 API requests/month',
      'OAuth providers',
      'Hosted auth pages',
      'Priority support'
    ],
    limits: {
      apps: 3,
      usersPerApp: 1000,
      requestsPerMonth: 100000
    }
  },
  {
    name: 'PRO',
    price: '$99',
    priceId: 'price_pro',
    description: 'For growing businesses',
    features: [
      '10 applications',
      '10,000 users per app',
      '1,000,000 API requests/month',
      'Advanced features',
      'Custom branding',
      'Webhooks',
      'Premium support'
    ],
    limits: {
      apps: 10,
      usersPerApp: 10000,
      requestsPerMonth: 1000000
    },
    popular: true
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    description: 'For large scale deployments',
    features: [
      'Unlimited applications',
      'Unlimited users',
      'Unlimited API requests',
      'SAML SSO',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated support'
    ],
    limits: {
      apps: -1,
      usersPerApp: -1,
      requestsPerMonth: -1
    }
  }
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const developer = await getCurrentDeveloper(accessToken);
  
  return json({ developer });
}

export async function action({ request }: ActionFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "upgrade") {
    const priceId = formData.get("priceId") as string;
    
    // Create Stripe checkout session
    const response = await apiRequest('/billing/checkout', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${request.url}/success`,
        cancelUrl: request.url,
      }),
    });
    
    // Error handling is done by apiRequest
    
    const { sessionUrl } = await response.json();
    return json({ redirectTo: sessionUrl });
  }
  
  if (action === "manage") {
    // Create Stripe portal session
    const response = await apiRequest('/billing/portal', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        returnUrl: request.url,
      }),
    });
    
    // Error handling is done by apiRequest
    
    const { sessionUrl } = await response.json();
    return json({ redirectTo: sessionUrl });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Billing() {
  const { developer } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  // Handle redirect after action
  if (fetcher.data?.redirectTo) {
    window.location.href = fetcher.data.redirectTo;
  }
  
  const currentPlan = PLANS.find(p => p.name === developer.plan) || PLANS[0];

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-surface-background">
      <header className="bg-surface-card shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Billing & Plans
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the {currentPlan.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  <Badge variant="outline" className="bg-blue-50">Active</Badge>
                </div>
                <p className="text-gray-500 mt-1">{currentPlan.description}</p>
              </div>
              
              {developer.plan !== 'FREE' && (
                <fetcher.Form method="post">
                  <input type="hidden" name="_action" value="manage" />
                  <Button type="submit" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </fetcher.Form>
              )}
            </div>
            
            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="border rounded p-4">
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-bold">
                  {developer._count?.apps || 0} / {currentPlan.limits.apps === -1 ? '∞' : currentPlan.limits.apps}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">
                  {developer._count?.totalUsers || 0} / {currentPlan.limits.usersPerApp === -1 ? '∞' : `${currentPlan.limits.usersPerApp}/app`}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-sm text-gray-500">API Requests (this month)</p>
                <p className="text-2xl font-bold">
                  {developer.monthlyRequests || 0} / {currentPlan.limits.requestsPerMonth === -1 ? '∞' : currentPlan.limits.requestsPerMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.popular ? 'border-blue-500 border-2' : ''}>
              {plan.popular && (
                <div className="bg-primary-500 text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-gray-500">/month</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  {plan.name === developer.plan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : plan.name === 'ENTERPRISE' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:sales@authservice.com">
                        Contact Sales
                      </a>
                    </Button>
                  ) : plan.priceId ? (
                    <fetcher.Form method="post">
                      <input type="hidden" name="_action" value="upgrade" />
                      <input type="hidden" name="priceId" value={plan.priceId} />
                      <Button 
                        type="submit" 
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        disabled={fetcher.state !== 'idle'}
                      >
                        {fetcher.state !== 'idle' ? 'Processing...' : 'Upgrade'}
                      </Button>
                    </fetcher.Form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Can I change plans at any time?</h4>
              <p className="text-sm text-gray-500">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">What happens if I exceed my plan limits?</h4>
              <p className="text-sm text-gray-500">
                We'll notify you when you're approaching your limits. API requests will be rate-limited once you exceed your plan's quota.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Do you offer annual billing?</h4>
              <p className="text-sm text-gray-500">
                Yes! Annual billing comes with a 20% discount. You can switch to annual billing from your billing portal.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-500">
                We accept all major credit cards through Stripe. Enterprise customers can also pay via invoice.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </AuthenticatedLayout>
  );
}