import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import type { Consent, Patient, Organization, ComplianceGroup } from '../types/index';

interface ConsentFormData {
  patientId: string;
  organizationId: string;
  consentType: string;
  consentDate: string;
  expiryDate: string;
  specificOrganizationId: string;
  attachmentFile: File | null;
}

export default function AdminConsents() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [complianceGroups, setComplianceGroups] = useState<ComplianceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedComplianceGroup, setSelectedComplianceGroup] = useState<ComplianceGroup | null>(null);
  const [formData, setFormData] = useState<ConsentFormData>({
    patientId: '',
    organizationId: '',
    consentType: '',
    consentDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    specificOrganizationId: '',
    attachmentFile: null
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // When organization changes, fetch its compliance group
    if (formData.organizationId) {
      const org = organizations.find(o => o.id === parseInt(formData.organizationId));
      if (org && org.complianceGroupId) {
        const group = complianceGroups.find(g => g.id === org.complianceGroupId);
        setSelectedComplianceGroup(group || null);
        if (group) {
          setFormData(prev => ({ ...prev, consentType: group.name }));
        }
      }
    } else {
      setSelectedComplianceGroup(null);
    }
  }, [formData.organizationId, organizations, complianceGroups]);

  const fetchData = async () => {
    try {
      const [consentsRes, patientsRes, orgsRes, groupsRes] = await Promise.all([
        api.get('/admin/consents'),
        api.get('/patients'),
        api.get('/admin/organizations'),
        api.get('/compliance-groups')
      ]);
      
      setConsents(consentsRes.data.consents || []);
      console.log('Patients response:', patientsRes.data);
      setPatients(patientsRes.data.patients || []);
      setOrganizations(orgsRes.data.organizations || []);
      setComplianceGroups(groupsRes.data.complianceGroups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      // Check if consent is required
      if (selectedComplianceGroup && !selectedComplianceGroup.requires_consent) {
        setError('This compliance group does not require consent');
        setCreating(false);
        return;
      }

      // Create consent record
      const consentData: any = {
        patientId: parseInt(formData.patientId),
        organizationId: parseInt(formData.organizationId),
        consentType: formData.consentType,
        consentDate: formData.consentDate,
        expiryDate: formData.expiryDate || null
      };

      if (selectedComplianceGroup?.requires_organization_consent && formData.specificOrganizationId) {
        consentData.specificOrganizationId = parseInt(formData.specificOrganizationId);
      }

      const consentResponse = await api.post('/admin/consents', consentData);
      
      // Upload attachment if provided
      if (formData.attachmentFile && consentResponse.data.consent) {
        const uploadData = new FormData();
        uploadData.append('attachment', formData.attachmentFile);
        uploadData.append('consentId', consentResponse.data.consent.id);
        
        try {
          await api.post('/consents/attachments', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadError) {
          console.error('Attachment upload failed:', uploadError);
          // Don't fail the entire operation if just the attachment fails
        }
      }

      setSuccess('Consent created successfully!');
      setFormData({
        patientId: '',
        organizationId: '',
        consentType: '',
        consentDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        specificOrganizationId: '',
        attachmentFile: null
      });
      setShowCreateForm(false);
      fetchData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create consent');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (consentId: number) => {
    if (!confirm('Are you sure you want to revoke this consent?')) return;

    try {
      await api.delete(`/admin/consents/${consentId}`);
      setSuccess('Consent revoked successfully');
      fetchData();
    } catch (error) {
      setError('Failed to revoke consent');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, attachmentFile: file });
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link to="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Consent Management</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Cancel' : 'New Consent'}
          </button>
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

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Consent</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient</label>
                  <select
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient's Organization</label>
                  <select
                    required
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedComplianceGroup && (
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-900">
                      <strong>Compliance Group:</strong> {selectedComplianceGroup.name}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedComplianceGroup.description}
                    </p>
                    {!selectedComplianceGroup.requires_consent && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ This compliance group does not require consent.
                      </p>
                    )}
                  </div>
                )}

                {selectedComplianceGroup?.requires_organization_consent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Specific Organization (Required)
                    </label>
                    <select
                      required
                      value={formData.specificOrganizationId}
                      onChange={(e) => setFormData({ ...formData, specificOrganizationId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select organization to share with</option>
                      {organizations
                        .filter(org => org.id !== parseInt(formData.organizationId))
                        .map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Consent Date</label>
                  <input
                    type="date"
                    required
                    value={formData.consentDate}
                    onChange={(e) => setFormData({ ...formData, consentDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Consent Document (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, images, or Word documents up to 10MB
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      patientId: '',
                      organizationId: '',
                      consentType: '',
                      consentDate: new Date().toISOString().split('T')[0],
                      expiryDate: '',
                      specificOrganizationId: '',
                      attachmentFile: null
                    });
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !!(selectedComplianceGroup && selectedComplianceGroup.requires_consent === false)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Consent'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {consents.map((consent) => (
              <li key={consent.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {consent.patient?.firstName} {consent.patient?.lastName}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>Organization: {consent.organization?.name}</p>
                      {consent.specificOrganization && (
                        <p>Shared with: {consent.specificOrganization.name}</p>
                      )}
                      <p>Type: {consent.consentType}</p>
                      <p>Date: {new Date(consent.consentDate).toLocaleDateString()}</p>
                      {consent.expiryDate && (
                        <p>Expires: {new Date(consent.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {consent.revoked ? (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Revoked
                      </span>
                    ) : (
                      <>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                        <button
                          onClick={() => handleRevoke(consent.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {consents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No consents found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}