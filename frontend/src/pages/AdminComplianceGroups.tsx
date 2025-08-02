import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';
import { ComplianceGroup } from '../types';

export default function AdminComplianceGroups() {
  const [complianceGroups, setComplianceGroups] = useState<ComplianceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceGroups();
  }, []);

  const fetchComplianceGroups = async () => {
    try {
      const response = await api.get('/compliance-groups');
      setComplianceGroups(response.data.complianceGroups || []);
    } catch (error) {
      console.error('Error fetching compliance groups:', error);
    } finally {
      setLoading(false);
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
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Groups</h1>
          <p className="mt-2 text-gray-600">
            Compliance groups define HIPAA compliance settings for organizations. These are typically created during system setup.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {complianceGroups.map((group) => (
              <li key={group.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {group.id} | Organizations: {(group as any).organization_count || 0}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {complianceGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No compliance groups found.</p>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900">Note</h3>
          <p className="mt-1 text-sm text-blue-700">
            Compliance groups are managed through database scripts during system setup. 
            To create additional compliance groups, contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}