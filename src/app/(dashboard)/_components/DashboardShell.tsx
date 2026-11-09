'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Store,
  Users,
  User,
  Menu,
  X,
  LogOut,
  KeyRound,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { getNavItems, type NavItemConfig, type UserRole } from '@/shared/lib/navigation';
import { useCurrentUser } from '@/modules/user/user.hooks';
import { useLogout } from '@/modules/auth/auth.hooks';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  GitBranch,
  Store,
  Users,
  User,
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: meData } = useCurrentUser();
  const logoutMutation = useLogout();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const meContext = meData?.data;
  const user = meContext?.user;
  const restaurant = meContext?.restaurant;
  const role = user?.role as UserRole | undefined;

  const navItems = role ? getNavItems(role) : [];

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // NOTE: mobile menu is closed in nav link onClick handlers (onNavigate) and
  // the logout/menu button handlers — NOT in a useEffect — to avoid the
  // react-hooks/exhaustive-deps warning that fires when setState is called
  // unconditionally inside an effect.

  const renderNavLinks = (items: NavItemConfig[], onNavigate?: () => void) => (
    <nav aria-label="Sidebar Navigation" className="space-y-1">
      {items.map((item) => {
        const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <IconComponent className={`h-4 w-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Open sidebar menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-xs">
                P
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">POSAI</span>
            </Link>

            {/* Restaurant Name */}
            {restaurant && (
              <span className="hidden sm:inline-block border-l border-slate-200 pl-4 text-sm font-medium text-slate-700">
                {restaurant.name}
              </span>
            )}
          </div>

          {/* User Menu & Role Badge */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-haspopup="menu"
                  aria-expanded={userDropdownOpen}
                  aria-label="User menu"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 leading-none">{user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.role}</p>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {user.role}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-slate-900/5 focus:outline-hidden z-40 border border-slate-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    <Link
                      href="/change-password"
                      role="menuitem"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <KeyRound className="h-4 w-4 text-slate-500" />
                      Change password
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      disabled={logoutMutation.isPending}
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutMutation.mutate();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area: Desktop Sidebar + Content */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white p-4">
          <div className="flex-1 space-y-4">{renderNavLinks(navItems)}</div>
        </aside>

        {/* Mobile Drawer (Accessible overlay & drawer) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white shadow-xs">
                    P
                  </span>
                  <span className="text-lg font-bold tracking-tight text-slate-900">POSAI</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Close sidebar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {restaurant && (
                <div className="py-3 px-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Restaurant
                  </p>
                  <p className="text-sm font-medium text-slate-800 truncate">{restaurant.name}</p>
                </div>
              )}

              <div className="flex-1 pt-4">
                {renderNavLinks(navItems, () => setMobileMenuOpen(false))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logoutMutation.isPending}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logoutMutation.mutate();
                  }}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
