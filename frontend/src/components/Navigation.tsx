'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Documents', href: '/documents', icon: '📄', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Master Document List', href: '/master-document-list', icon: '📚', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Events & Logs', href: '/events', icon: '📋', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'AI Center', href: '/ai-center', icon: '🤖', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Calendar', href: '/calendar', icon: '📅', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Responsibility Matrix', href: '/responsibility-matrix', icon: '👥', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'USER'] },
  { name: 'Audit Mode', href: '/audit', icon: '🔍', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN'] },
  { name: 'Reports', href: '/reports', icon: '📊', roles: ['SUPER_ADMIN', 'ACCOUNT_ADMIN'] },
  { name: 'System Admin', href: '/admin', icon: '⚙️', roles: ['SUPER_ADMIN'] },
  { name: 'Organization', href: '/admin/organization', icon: '🏢', roles: ['ACCOUNT_ADMIN'] },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className={`bg-white shadow-sm border-r h-screen transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">ETS Aero ISO</h1>
              <p className="text-xs text-gray-600">Compliance Management</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems
              .filter(item => !user || item.roles.includes(user.role))
              .map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {!isCollapsed && (
                        <span className="ml-3 font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-600">{user?.email || 'user@example.com'}</p>
                <p className="text-xs text-blue-600 font-medium">
                  {user?.role?.replace('_', ' ') || 'USER'}
                </p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="mt-4 space-y-2">
              <Link
                href="/onboarding"
                className="block w-full text-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                ⚙️ Setup Wizard
              </Link>
              <button 
                onClick={logout}
                className="block w-full text-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}