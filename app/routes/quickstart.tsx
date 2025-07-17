import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { AuthenticatedLayout } from "~/components/layout";
import { Copy, Check, ChevronRight, Code, Terminal, Palette, Shield, Zap } from "lucide-react";
import { requireAuth, getCurrentDeveloper } from "~/services/auth.server";

const FRAMEWORKS = [
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'nextjs', name: 'Next.js', icon: '▲' },
  { id: 'vue', name: 'Vue.js', icon: '💚' },
  { id: 'vanilla', name: 'Vanilla JS', icon: '🟨' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { accessToken } = await requireAuth(request);
  const developer = await getCurrentDeveloper(accessToken);
  
  return json({ developer });
}

export default function QuickStart() {
  const { developer } = useLoaderData<typeof loader>();
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const getInstallCommand = () => {
    switch (selectedFramework) {
      case 'react':
      case 'nextjs':
        return 'npm install @authservice/react';
      case 'vue':
        return 'npm install @authservice/vue';
      default:
        return 'npm install @authservice/core';
    }
  };

  const getSetupCode = () => {
    switch (selectedFramework) {
      case 'react':
        return `import { AuthProvider } from '@authservice/react';
import { AuthServiceClient } from '@authservice/core';
import { BrowserRouter } from 'react-router-dom';

// Initialize the auth client
const authClient = new AuthServiceClient({
  apiUrl: 'YOUR_AUTH_SERVICE_URL', // e.g., https://auth.example.com
  appId: 'YOUR_APP_ID',
  clientId: 'YOUR_CLIENT_ID',
});

function App() {
  return (
    <BrowserRouter>
      <AuthProvider client={authClient}>
        {/* Your app components */}
      </AuthProvider>
    </BrowserRouter>
  );
}`;
      case 'nextjs':
        return `// _app.tsx
import { AuthProvider } from '@authservice/react';
import { AuthServiceClient } from '@authservice/core';

// Initialize the auth client
const authClient = new AuthServiceClient({
  apiUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL!, // e.g., https://auth.example.com
  appId: process.env.NEXT_PUBLIC_APP_ID!,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
});

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider client={authClient}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;`;
      case 'vue':
        return `// main.js
import { createApp } from 'vue';
import { createAuth } from '@authservice/vue';
import App from './App.vue';

const auth = createAuth({
  apiUrl: 'YOUR_AUTH_SERVICE_URL', // e.g., https://auth.example.com
  appId: 'YOUR_APP_ID',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: window.location.origin + '/callback'
});

createApp(App)
  .use(auth)
  .mount('#app');`;
      default:
        return `import { AuthServiceClient } from '@authservice/core';

const auth = new AuthServiceClient({
  apiUrl: 'YOUR_AUTH_SERVICE_URL', // e.g., https://auth.example.com
  appId: 'YOUR_APP_ID',
  clientId: 'YOUR_CLIENT_ID',
});

// Login
await auth.login();

// Get user
const user = auth.getUser();

// Logout
await auth.logout();`;
    }
  };

  const getUsageCode = () => {
    switch (selectedFramework) {
      case 'react':
      case 'nextjs':
        return `import { useAuth } from '@authservice/react';

function LoginButton() {
  const { login, logout, isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <button onClick={login}>Login</button>;
}`;
      case 'vue':
        return `<template>
  <div>
    <div v-if="isAuthenticated">
      <p>Welcome, {{ user.email }}!</p>
      <button @click="logout">Logout</button>
    </div>
    <button v-else @click="login">Login</button>
  </div>
</template>

<script setup>
import { useAuth } from '@authservice/vue';

const { login, logout, isAuthenticated, user } = useAuth();
</script>`;
      default:
        return `// Check authentication status
if (auth.isAuthenticated()) {
  const user = auth.getUser();
  console.log('User:', user.email);
}

// Handle login button
document.getElementById('login-btn').addEventListener('click', () => {
  auth.login();
});

// Handle logout button
document.getElementById('logout-btn').addEventListener('click', () => {
  auth.logout();
});`;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-surface-background">
        <header className="bg-surface-card shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Quick Start Guide
            </h1>
            <p className="mt-2 text-gray-500">
              Get up and running with authentication in minutes
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Framework Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Your Framework</CardTitle>
              <CardDescription>Select your framework to see tailored instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FRAMEWORKS.map((framework) => (
                  <button
                    key={framework.id}
                    onClick={() => setSelectedFramework(framework.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedFramework === framework.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-surface-border hover:border-surface-border'
                    }`}
                  >
                    <div className="text-2xl mb-2">{framework.icon}</div>
                    <div className="font-medium">{framework.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-6">
            {/* Step 1: Install SDK */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completedSteps.has('install') ? 'bg-success text-white' : 'bg-gray-200'
                    }`}>
                      {completedSteps.has('install') ? <Check className="h-5 w-5" /> : '1'}
                    </div>
                    <CardTitle>Install the SDK</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStep('install')}
                  >
                    {completedSteps.has('install') ? 'Mark incomplete' : 'Mark complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg flex items-center justify-between">
                  <code>{getInstallCommand()}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => copyCode(getInstallCommand(), 'install')}
                  >
                    {copiedCode === 'install' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  This installs the authentication SDK for {FRAMEWORKS.find(f => f.id === selectedFramework)?.name}
                </p>
              </CardContent>
            </Card>

            {/* Step 2: Setup Provider */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completedSteps.has('setup') ? 'bg-success text-white' : 'bg-gray-200'
                    }`}>
                      {completedSteps.has('setup') ? <Check className="h-5 w-5" /> : '2'}
                    </div>
                    <CardTitle>Setup Authentication Provider</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStep('setup')}
                  >
                    {completedSteps.has('setup') ? 'Mark incomplete' : 'Mark complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <div className="flex justify-between items-start">
                    <pre className="text-sm">{getSetupCode()}</pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-gray-600 ml-4"
                      onClick={() => copyCode(getSetupCode(), 'setup')}
                    >
                      {copiedCode === 'setup' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Replace the following with your actual values:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
                      <li><strong>YOUR_AUTH_SERVICE_URL</strong>: The URL of this auth service (e.g., http://localhost:3000)</li>
                      <li><strong>YOUR_APP_ID</strong>: Your app's ID from the app settings</li>
                      <li><strong>YOUR_CLIENT_ID</strong>: Your app's client ID from the credentials page</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>CORS Configuration:</strong> Make sure to add your application's URL to the "Allowed Origins" in your app settings to enable cross-origin requests.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Implement Auth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completedSteps.has('implement') ? 'bg-success text-white' : 'bg-gray-200'
                    }`}>
                      {completedSteps.has('implement') ? <Check className="h-5 w-5" /> : '3'}
                    </div>
                    <CardTitle>Implement Authentication</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStep('implement')}
                  >
                    {completedSteps.has('implement') ? 'Mark incomplete' : 'Mark complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <div className="flex justify-between items-start">
                    <pre className="text-sm">{getUsageCode()}</pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-gray-600 ml-4"
                      onClick={() => copyCode(getUsageCode(), 'usage')}
                    >
                      {copiedCode === 'usage' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completedSteps.has('test') ? 'bg-success text-white' : 'bg-gray-200'
                    }`}>
                      {completedSteps.has('test') ? <Check className="h-5 w-5" /> : '4'}
                    </div>
                    <CardTitle>Test Your Integration</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStep('test')}
                  >
                    {completedSteps.has('test') ? 'Mark incomplete' : 'Mark complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-gray-500" />
                  <p>Run your application and click the login button</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                  <p>You'll be redirected to the hosted login page</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                  <p>After login, you'll be redirected back to your app</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <p>The user object will be available in your app</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Enhance your authentication implementation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <Shield className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Enable MFA</h4>
                    <p className="text-sm text-gray-500">
                      Add two-factor authentication for enhanced security
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Palette className="h-8 w-8 text-purple-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Customize Branding</h4>
                    <p className="text-sm text-gray-500">
                      Customize the hosted pages with your brand colors and logo
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Code className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Add OAuth Providers</h4>
                    <p className="text-sm text-gray-500">
                      Enable social login with Google, GitHub, and more
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Zap className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Setup Webhooks</h4>
                    <p className="text-sm text-gray-500">
                      Get real-time notifications for auth events
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-2 text-primary-600 hover:underline">
                  <ChevronRight className="h-4 w-4" />
                  API Documentation
                </a>
                <a href="#" className="flex items-center gap-2 text-primary-600 hover:underline">
                  <ChevronRight className="h-4 w-4" />
                  SDK Reference
                </a>
                <a href="#" className="flex items-center gap-2 text-primary-600 hover:underline">
                  <ChevronRight className="h-4 w-4" />
                  Example Applications
                </a>
                <a href="#" className="flex items-center gap-2 text-primary-600 hover:underline">
                  <ChevronRight className="h-4 w-4" />
                  Video Tutorials
                </a>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}