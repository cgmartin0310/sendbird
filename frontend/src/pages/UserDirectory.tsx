import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: number;
  organizationName?: string;
  phone?: string;
}

const UserDirectory = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [organizations, setOrganizations] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, organizationFilter, users]);

  const fetchUsers = async () => {
    try {
      const [usersResponse, orgsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/organizations')
      ]);
      
      // Map the users to include organization names
      const usersData = usersResponse.data.users || [];
      const orgsData = orgsResponse.data.organizations || [];
      
      const usersWithOrgNames = usersData.map((user: any) => ({
        ...user,
        organizationName: orgsData.find((org: any) => org.id === user.organizationId)?.name || 'N/A'
      }));
      
      setUsers(usersWithOrgNames);
      setFilteredUsers(usersWithOrgNames);
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.organizationName?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Organization filter
    if (organizationFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.organizationId === parseInt(organizationFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'care_team_member':
        return 'bg-blue-100 text-blue-800';
      case 'peer_support':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Directory</h1>
        <p className="mt-2 text-gray-600">
          Search and find contact information for all users in the system
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search Bar */}
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="care_team_member">Care Team Member</option>
              <option value="peer_support">Peer Support</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Organization
            </label>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-3">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {/* Email */}
              <div className="flex items-center text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                <a 
                  href={`mailto:${user.email}`}
                  className="hover:text-blue-600 truncate"
                  title={user.email}
                >
                  {user.email}
                </a>
              </div>

              {/* Organization */}
              <div className="flex items-center text-sm text-gray-600">
                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate" title={user.organizationName}>
                  {user.organizationName || 'No Organization'}
                </span>
              </div>

              {/* Phone (if available) */}
              {user.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a 
                    href={`tel:${user.phone}`}
                    className="hover:text-blue-600"
                  >
                    {user.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <a
                  href={`mailto:${user.email}`}
                  className="flex-1 text-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Send Email
                </a>
                <Link
                  to={`/conversations?userId=${user.id}`}
                  className="flex-1 text-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  View Conversations
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserDirectory;
