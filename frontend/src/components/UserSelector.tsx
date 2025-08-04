import { useState, useEffect } from 'react';
import api from '../config/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: number;
}

interface UserSelectorProps {
  selectedUsers: number[];
  onChange: (users: number[]) => void;
  patientId: string;
}

export default function UserSelector({ selectedUsers, onChange, patientId }: UserSelectorProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('UserSelector rendering - patientId:', patientId);

  useEffect(() => {
    if (patientId) {
      console.log('Fetching users for patient:', patientId);
      fetchUsers();
    }
  }, [patientId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Calling /api/users...');
      // Get all care team members and admins
      const response = await api.get('/users');
      console.log('Users response:', response.data);
      const users = response.data.users || [];
      
      // Filter for care team members and admins (they can participate in conversations)
      const eligibleUsers = users.filter((user: User) => 
        user.role === 'care_team_member' || user.role === 'admin'
      );
      
      console.log('Eligible users:', eligibleUsers);
      setAvailableUsers(eligibleUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      onChange(selectedUsers.filter(id => id !== userId));
    } else {
      onChange([...selectedUsers, userId]);
    }
  };

  if (!patientId) {
    return (
      <div className="text-sm text-gray-500">
        Please select a patient first
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading users...</div>;
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border rounded-lg">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Add Team Members (Optional)
      </label>
      <div className="space-y-2 max-h-48 overflow-y-auto bg-white border rounded-md p-3">
        {availableUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No other users available</p>
        ) : (
          availableUsers.map(user => (
            <label
              key={user.id}
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email} • {user.role.replace(/_/g, ' ')}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Note: Only users with consent for this patient will be able to participate
      </p>
    </div>
  );
}