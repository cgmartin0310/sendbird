import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Organization {
  id: number;
  name: string;
  compliance_group_id?: number;
  compliance_group_name?: string;
  user_count: number;
  created_at: string;
}

interface ComplianceGroup {
  id: number;
  name: string;
  description: string;
}

const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [complianceGroups, setComplianceGroups] = useState<ComplianceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    complianceGroupId: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    complianceGroupId: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsResponse, groupsResponse] = await Promise.all([
        api.get('/admin/organizations'),
        api.get('/compliance-groups')
      ]);
      setOrganizations(orgsResponse.data.organizations);
      setComplianceGroups(groupsResponse.data.complianceGroups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/admin/organizations');
      setOrganizations(response.data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload: any = { name: formData.name };
      if (formData.complianceGroupId) {
        payload.complianceGroupId = parseInt(formData.complianceGroupId);
      }
      
      await api.post('/admin/organizations', payload);
      
      setSuccess('Organization created successfully');
      setFormData({ name: '', complianceGroupId: '' });
      setShowCreateForm(false);
      fetchOrganizations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create organization');
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditFormData({
      name: org.name,
      complianceGroupId: org.compliance_group_id?.toString() || ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editingOrg) return;

    try {
      const payload: any = { name: editFormData.name };
      if (editFormData.complianceGroupId) {
        payload.complianceGroupId = parseInt(editFormData.complianceGroupId);
      }
      
      await api.put(`/admin/organizations/${editingOrg.id}`, payload);
      
      setSuccess('Organization updated successfully');
      setEditingOrg(null);
      setEditFormData({ name: '', complianceGroupId: '' });
      fetchOrganizations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update organization');
    }
  };

  const cancelEdit = () => {
    setEditingOrg(null);
    setEditFormData({ name: '', complianceGroupId: '' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
          <p className="mt-2 text-gray-600">
            Manage healthcare organizations and their compliance settings.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{success}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Compliance Group</label>
                <select
                  required
                  value={formData.complianceGroupId}
                  onChange={(e) => setFormData({ ...formData, complianceGroupId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a compliance group</option>
                  {complianceGroups && complianceGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the appropriate compliance group for this organization's data sharing requirements.
                </p>
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

        {/* Edit Form */}
        {editingOrg && (
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Edit Organization</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., City Hospital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Compliance Group</label>
                <select
                  required
                  value={editFormData.complianceGroupId}
                  onChange={(e) => setEditFormData({ ...editFormData, complianceGroupId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a compliance group</option>
                  {complianceGroups && complianceGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the appropriate compliance group for this organization's data sharing requirements.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update Organization
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Organizations List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Organizations ({organizations.length})</h3>
            {!showCreateForm && !editingOrg && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                New Organization
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-200">
            {organizations.map((org) => (
              <li key={org.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{org.name}</h4>
                        <p className="text-sm text-gray-500">
                          Compliance Group: {org.compliance_group_name || 'Not assigned'}
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
                  </div>
                  {!editingOrg && (
                    <div className="ml-4">
                      <button
                        onClick={() => handleEdit(org)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                        title="Edit organization"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {organizations.length === 0 && !showCreateForm && !editingOrg && (
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
    </div>
  );
};

export default AdminOrganizations;