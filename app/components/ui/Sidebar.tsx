import { Link, useLocation } from "@remix-run/react";
import { useState } from "react";
import {
  Home,
  Box,
  Users,
  Key,
  BarChart3,
  BookOpen,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Form } from "@remix-run/react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Applications", href: "/apps", icon: Box },
  { name: "Quick Start", href: "/quickstart", icon: BookOpen },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  developer?: {
    email: string;
    plan: string;
  };
}

export function Sidebar({ developer }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const NavItemComponent = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = expandedItems.includes(item.name);
    const active = isActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`
              w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
              transition-colors duration-150 ease-in-out
              ${active
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:bg-surface-background hover:text-gray-900"
              }
              ${depth > 0 ? "ml-6" : ""}
            `}
          >
            <div className="flex items-center">
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  active ? "text-primary-600" : "text-gray-400"
                }`}
              />
              {item.name}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => (
                <NavItemComponent key={child.name} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-md
          transition-colors duration-150 ease-in-out
          ${active
            ? "bg-primary-50 text-primary-700"
            : "text-gray-700 hover:bg-surface-background hover:text-gray-900"
          }
          ${depth > 0 ? "ml-6" : ""}
        `}
      >
        <item.icon
          className={`mr-3 h-5 w-5 flex-shrink-0 ${
            active ? "text-primary-600" : "text-gray-400"
          }`}
        />
        {item.name}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link to="/" className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">
            Auth Service
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavItemComponent key={item.name} item={item} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-4">
        <div className="space-y-3">
          {/* Plan badge */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-500">Plan</span>
            <span className={`badge ${
              developer?.plan === 'FREE' ? 'badge-gray' :
              developer?.plan === 'STARTER' ? 'badge-primary' :
              developer?.plan === 'PRO' ? 'badge-success' :
              'badge-warning'
            }`}>
              {developer?.plan || 'FREE'}
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500">
                  {developer?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {developer?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Form method="post" action="/logout">
            <button
              type="submit"
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-surface-background hover:text-gray-900 transition-colors duration-150"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Logout
            </button>
          </Form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-md bg-surface-card shadow-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-surface-card transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-surface-card border-r">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}