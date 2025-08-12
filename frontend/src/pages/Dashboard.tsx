import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import api from '../config/api';

interface DashboardStats {
  patients: number;
  conversations: number;
  activeConsents: number;
  recentPatients?: any[];
  recentConversations?: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    conversations: 0,
    activeConsents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats from the new endpoint
      const dashboardRes = await api.get('/dashboard/stats');
      const { stats: dashboardStats, recentActivity } = dashboardRes.data;

      setStats({
        patients: dashboardStats.patients || 0,
        conversations: dashboardStats.conversations || 0,
        activeConsents: dashboardStats.activeConsents || 0,
        recentPatients: recentActivity?.patients?.slice(0, 3) || [],
        recentConversations: recentActivity?.conversations?.slice(0, 3) || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to individual API calls if dashboard endpoint fails
      try {
        const [patientsRes, conversationsRes, consentsRes] = await Promise.all([
          api.get('/patients?limit=5'),
          api.get('/conversations'),
          api.get('/admin/consents')
        ]);

        const activeConsents = consentsRes.data.consents?.filter((c: any) => c.is_active)?.length || 0;

        setStats({
          patients: patientsRes.data.patients?.length || 0,
          conversations: conversationsRes.data.conversations?.length || 0,
          activeConsents,
          recentPatients: patientsRes.data.patients?.slice(0, 3) || [],
          recentConversations: conversationsRes.data.conversations?.slice(0, 3) || []
        });
      } catch (fallbackError) {
        console.error('Fallback dashboard data fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
      <p className="mt-2 text-gray-600">Healthcare Messaging Dashboard</p>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Link to="/patients" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.patients}</dd>
                  <dd className="text-sm text-gray-600">Manage patient records</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/conversations" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Conversations</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.conversations}</dd>
                  <dd className="text-sm text-gray-600">Team messaging</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/consents" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Consents</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.activeConsents}</dd>
                  <dd className="text-sm text-gray-600">HIPAA compliant</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/patients" 
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <EyeIcon className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-sm font-medium text-gray-700">View Patients</span>
          </Link>
          
          <Link 
            to="/conversations" 
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm font-medium text-gray-700">Start Conversation</span>
          </Link>
          
          <Link 
            to="/admin/consents" 
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-purple-500 mr-3" />
            <span className="text-sm font-medium text-gray-700">Manage Consents</span>
          </Link>
          
          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="h-5 w-5 text-orange-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
            <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {stats.recentPatients && stats.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient: any) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(patient.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link 
                    to={`/patients/${patient.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent patients</p>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Conversations</h3>
            <Link to="/conversations" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {stats.recentConversations && stats.recentConversations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentConversations.map((conversation: any) => (
                <div key={conversation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {conversation.title || `${conversation.patient_first_name} ${conversation.patient_last_name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link 
                    to={`/chat/${encodeURIComponent(conversation.sendbird_channel_url)}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Open →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent conversations</p>
          )}
        </div>
      </div>

      {/* Admin Quick Links */}
      {user?.role === 'admin' && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/admin/users" 
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">User Management</span>
            </Link>
            
            <Link 
              to="/admin/organizations" 
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BuildingOfficeIcon className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Organizations</span>
            </Link>
            
            <Link 
              to="/admin/compliance-groups" 
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShieldCheckIcon className="h-5 w-5 text-purple-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Compliance Groups</span>
            </Link>
            
            <Link 
              to="/admin/consents" 
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-orange-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Consent Management</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
