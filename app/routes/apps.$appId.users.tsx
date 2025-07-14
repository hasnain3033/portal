import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { requireAuth } from "~/services/auth.server";
import { apiRequest } from "~/services/api.server";
import { Search, User, Mail, Calendar, Shield, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

interface AppUser {
  id: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  _count?: {
    sessions: number;
    oauthAccounts: number;
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const appId = params.appId!;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  
  // Fetch users for this app
  const response = await apiRequest(
    `/users/search?appId=${appId}&page=${page}&search=${search}`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  
  const data = await response.json();
  
  return json({ 
    users: data.users || [], 
    totalPages: data.totalPages || 1,
    currentPage: page,
    totalUsers: data.total || 0,
    search,
    appId
  });
}

export default function AppUsers() {
  const { users, totalPages, currentPage, totalUsers, search: initialSearch } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      prev.set("search", searchInput);
      prev.set("page", "1");
      return prev;
    });
  };

  const goToPage = (page: number) => {
    setSearchParams(prev => {
      prev.set("page", page.toString());
      return prev;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage users for this application ({totalUsers} total)
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchInput ? 'No users found matching your search.' : 'No users yet. Users will appear here when they sign up.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Security</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: AppUser) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{user.email}</p>
                              {user.phone && (
                                <p className="text-sm text-gray-500">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {user.emailVerified ? (
                              <Badge variant="outline" className="bg-green-50">
                                <Mail className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50">
                                <Mail className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {user.mfaEnabled && (
                              <Badge variant="outline" className="bg-blue-50">
                                <Shield className="h-3 w-3 mr-1" />
                                2FA
                              </Badge>
                            )}
                            {user._count?.oauthAccounts && user._count.oauthAccounts > 0 && (
                              <Badge variant="outline">
                                OAuth ({user._count.oauthAccounts})
                              </Badge>
                            )}
                            {user._count?.sessions && user._count.sessions > 0 && (
                              <Badge variant="outline">
                                {user._count.sessions} sessions
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600">
                            {user.lastLoginAt ? getRelativeTime(user.lastLoginAt) : 'Never'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Verification Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers > 0 
                ? `${Math.round((users.filter((u: AppUser) => u.emailVerified).length / totalUsers) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u: AppUser) => u.emailVerified).length} verified users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Adoption</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers > 0 
                ? `${Math.round((users.filter((u: AppUser) => u.mfaEnabled).length / totalUsers) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u: AppUser) => u.mfaEnabled).length} users with 2FA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OAuth Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u: AppUser) => u._count?.oauthAccounts && u._count.oauthAccounts > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Using social login
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}