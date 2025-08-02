import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';

interface Organization {
  id: number;
  name: string;
  compliance_group_name: string | null;
  user_count: number;
  created_at: string;
}

const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    complianceGroupId: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/admin/organizations');
      setOrganizations(response.data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await api.post('/admin/organizations', {
        name: formData.name,
        complianceGroupId: formData.complianceGroupId ? parseInt(formData.complianceGroupId) : null
      });
      
      setSuccess('Organization created successfully');
      setFormData({ name: '', complianceGroupId: '' });
      setShowCreateForm(false);
      fetchOrganizations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create organization');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
          <p className="mt-2 text-gray-600">Manage healthcare organizations and their compliance settings</p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Admin
          </Link>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'New Organization'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Organization</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., City Hospital"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', complianceGroupId: '' });
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Organization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Organizations ({organizations.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {organizations.map((org) => (
            <li key={org.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{org.name}</h4>
                  <p className="text-sm text-gray-500">
                    Compliance Group: {org.compliance_group_name || 'Default Group'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">{org.user_count}</p>
                  <p className="text-sm text-gray-500">Users</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {organizations.length === 0 && !showCreateForm && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No organizations yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Create your first organization
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrganizations;