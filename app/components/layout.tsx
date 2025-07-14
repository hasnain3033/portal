import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./ui/Sidebar";
import { useLoaderData } from "@remix-run/react";

interface LayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: LayoutProps) {
  // Try to get developer data from any route that provides it
  const data = useLoaderData() as any;
  const developer = data?.developer || data?.user || null;

  return (
    <div className="min-h-screen bg-surface-background">
      <Sidebar developer={developer} />
      
      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}