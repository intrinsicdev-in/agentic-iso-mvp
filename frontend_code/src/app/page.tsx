'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  CalendarIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  artefacts: number;
  risks: number;
  upcomingDeadlines: number;
  pendingReviews: number;
  activeAgents: number;
  complaints: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    artefacts: 0,
    risks: 0,
    upcomingDeadlines: 0,
    pendingReviews: 0,
    activeAgents: 0,
    complaints: 0
  });

  useEffect(() => {
    // TODO: Fetch actual stats from API
    setStats({
      artefacts: 24,
      risks: 8,
      upcomingDeadlines: 5,
      pendingReviews: 3,
      activeAgents: 4,
      complaints: 2
    });
  }, []);

  const dashboardCards = [
    {
      title: 'Artefacts',
      value: stats.artefacts,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      href: '/artefacts'
    },
    {
      title: 'Active Risks',
      value: stats.risks,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      href: '/risks'
    },
    {
      title: 'Upcoming Deadlines',
      value: stats.upcomingDeadlines,
      icon: CalendarIcon,
      color: 'bg-yellow-500',
      href: '/calendar'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
      href: '/reviews'
    },
    {
      title: 'AI Agents',
      value: stats.activeAgents,
      icon: CogIcon,
      color: 'bg-purple-500',
      href: '/agents'
    },
    {
      title: 'Complaints',
      value: stats.complaints,
      icon: UserGroupIcon,
      color: 'bg-orange-500',
      href: '/risks'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agentic ISO Dashboard</h1>
          <p className="mt-2 text-gray-600">AI-assisted ISO 9001 and 27001 compliance management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/artefacts/new">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Create Artefact
              </button>
            </Link>
            <Link href="/risks/new">
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                Log Risk
              </button>
            </Link>
            <Link href="/calendar/events/new">
              <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                Schedule Event
              </button>
            </Link>
            <Link href="/reviews/new">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Start Review
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Quality Policy updated by Quality Manager</span>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New risk identified by Risk Register Agent</span>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Management review scheduled for Feb 1st</span>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
