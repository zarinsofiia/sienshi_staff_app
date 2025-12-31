'use client';

import { useState, Suspense, useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Notification from '../../components/ui/Notification';
import { APP_CONSTANT } from '../../app/config/Constant';
import PageLoader from '../loader/PageLoader';
import ThemeSwitch from '../../components/ui/ThemeSwitch';
import '../hooks/themes.css';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { SidebarItem, fetchModuleList } from '../../app/data/sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchModuleList();
        setSidebarItems(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  // Load from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Toggle + persist
  const toggleSidebarCollapsed = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const handleLogout = () => router.push('/');
  const handleMenuClick = (href: string) => {
    setSidebarOpen(false);
    startTransition(() => router.push(href));
  };

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-[var(--sidebar-bg)] shadow-lg transform transition-transform duration-300
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20 md:w-20' : 'w-64 md:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center space-x-2">
              {/* Always show SK */}
              <div className="w-8 h-8 bg-[var(--button-bg)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--button-text)] font-bold text-sm">SK</span>
              </div>

              {/* Only show the full name when expanded */}
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold">{APP_CONSTANT.name}</h1>
              )}
            </div>
            <button
              onClick={() =>
                window.innerWidth < 768
                  ? setSidebarOpen(false)
                  : toggleSidebarCollapsed()
              }
              className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.href)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left
                    ${
                      isActive
                        ? 'bg-[var(--button-bg)] text-[var(--button-text)]'
                        : 'hover:bg-[var(--sidebar-hover-bg)]'
                    }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-[var(--border-color)] p-4">
            <div
              className={`flex items-center space-x-3 mb-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Admin User</p>
                  <p className="text-xs truncate opacity-70">admin@company.com</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        {/* Top Navigation */}
        <header className="bg-[var(--header-bg)] border-b border-[var(--border-color)] h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs opacity-70 hidden sm:block">Welcome back, Admin</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Notification 
              count={3} 
              onClick={() => {
                // open a notification drawer, modal, or navigate to /notifications
                console.log('Notifications clicked');
              }} />
            <ThemeSwitch />
          </div>
        </header>

        <Suspense fallback={<PageLoader />}>
          <main className="flex-1 overflow-auto">
            {isPending ? <PageLoader /> : <div className="p-4 md:p-6">{children}</div>}
          </main>
        </Suspense>
      </div>
    </div>
  );
}