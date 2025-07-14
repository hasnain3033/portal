import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAuth, getCurrentDeveloper, getDashboardStats, apiRequestWithAuth, refreshAccessToken, getUserSession, storage } from "~/services/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Box, BarChart3, Zap } from "lucide-react";
import { AuthenticatedLayout } from "~/components/layout";
import { StatsCard } from "~/components/ui/StatsCard";

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken, session } = await requireAuth(request);
  
  try {
    // First attempt with current token
    const [developer, stats] = await Promise.all([
      getCurrentDeveloper(accessToken),
      getDashboardStats(accessToken),
    ]);

    return json({ developer, stats });
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error);
    
    // If it's a 401, try to refresh the token once
    if (error.message?.includes('401')) {
      console.log("Token expired, attempting refresh...");
      const newAccessToken = await refreshAccessToken(request);
      
      if (newAccessToken) {
        console.log("Got new access token, retrying requests...");
        // Update session with new token
        session.set("accessToken", newAccessToken);
        
        try {
          // Retry with new token
          const [developer, stats] = await Promise.all([
            getCurrentDeveloper(newAccessToken),
            getDashboardStats(newAccessToken),
          ]);

          // Return data with updated session cookie
          return json({ developer, stats }, {
            headers: {
              "Set-Cookie": await storage.commitSession(session),
            },
          });
        } catch (retryError) {
          console.error("Retry failed after refresh:", retryError);
          // If still failing, the refresh token might be invalid
          throw redirect("/login");
        }
      } else {
        console.log("Token refresh failed, redirecting to login");
        throw redirect("/login");
      }
    }
    
    // If error is not 401, redirect to login
    throw redirect("/login");
  }
}

export default function Dashboard() {
  const { developer, stats } = useLoaderData<typeof loader>();

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Here's an overview of your authentication service.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Apps"
            value={stats.totalApps}
            description={
              stats.planLimits.apps.limit === -1 
                ? "Unlimited" 
                : `${stats.planLimits.apps.limit - stats.totalApps} remaining`
            }
            icon={<Box />}
          />

          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            description="Across all applications"
            icon={<Users />}
          />

          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            description="Last 30 days"
            icon={<BarChart3 />}
            trend={{ value: 12, isPositive: true }}
          />

          <StatsCard
            title="Active Sessions"
            value={stats.totalSessions}
            description="Current active sessions"
            icon={<Zap />}
          />
        </div>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <div className="flex h-full items-end justify-between space-x-2">
                {stats.userGrowth.map((day, index) => (
                  <div key={index} className="flex-1 group">
                    <div className="relative">
                      <div 
                        className="bg-primary-500 rounded-t transition-all duration-200 group-hover:bg-primary-600"
                        style={{ 
                          height: `${Math.max(20, (day.count / Math.max(...stats.userGrowth.map(d => d.count)) * 280))}px` 
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                          {day.count}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-center text-gray-500">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'user_signup' 
                        ? 'bg-success-light/10 text-success' 
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      {activity.type === 'user_signup' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <Zap className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'user_signup' 
                        ? `New user signed up`
                        : `User logged in`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.details.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.details.appName} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}