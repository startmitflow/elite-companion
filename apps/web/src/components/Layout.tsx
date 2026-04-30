import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/ships', label: 'Ships', icon: '🚀' },
  { path: '/materials', label: 'Materials', icon: '📦' },
  { path: '/missions', label: 'Missions', icon: '📋' },
  { path: '/trading', label: 'Trading', icon: '💰' },
  { path: '/colonisation', label: 'Colonisation', icon: '🌍' },
  { path: '/exploration', label: 'Exploration', icon: '🔭' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-elite-darker">
      {/* Header */}
      <header className="bg-elite-dark border-b border-elite-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-elite-orange font-eurostile text-xl tracking-wider">
              ELITE COMPANION
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.commanderName && (
              <span className="text-elite-muted text-sm">
                CMDR {user.commanderName}
              </span>
            )}
            <button
              onClick={logout}
              className="btn btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-16 md:w-48 bg-elite-dark border-r border-elite-border">
          <div className="py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-elite-border text-elite-orange'
                    : 'text-elite-muted hover:text-white hover:bg-elite-border/50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}