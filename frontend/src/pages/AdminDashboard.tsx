import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { UserGroupIcon, BuildingOfficeIcon, DocumentCheckIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  users: number;
  patients: number;
  conversations: number;
  organizations: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      // Extract stats from the nested response structure
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      } else {
        console.error('Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.users || 0,
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      name: 'Organizations',
      value: stats?.organizations || 0,
      icon: BuildingOfficeIcon,
      href: '/admin/organizations',
      color: 'bg-green-500'
    },
    {
      name: 'Total Patients',
      value: stats?.patients || 0,
      icon: DocumentCheckIcon,
      href: '/patients',
      color: 'bg-purple-500'
    },
    {
      name: 'Conversations',
      value: stats?.conversations || 0,
      icon: ChatBubbleLeftRightIcon,
      href: '/conversations',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage users, organizations, and compliance settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/users"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/organizations"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Manage Organizations
          </Link>
          <Link
            to="/admin/consents"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Manage Consents
          </Link>
          <Link
            to="/directory"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            User Directory
          </Link>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Administration</h2>
        <div className="space-y-3">
          <Link to="/admin/users" className="block text-blue-600 hover:text-blue-800">
            → User Management
          </Link>
          <Link to="/admin/organizations" className="block text-blue-600 hover:text-blue-800">
            → Organization Management
          </Link>
          <Link to="/admin/consents" className="block text-blue-600 hover:text-blue-800">
            → Consent Management
          </Link>
          <Link to="/admin/compliance-groups" className="block text-blue-600 hover:text-blue-800">
            → Compliance Groups
          </Link>
          <Link to="/directory" className="block text-blue-600 hover:text-blue-800">
            → User Directory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;