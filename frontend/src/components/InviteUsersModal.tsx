import { useState, useEffect } from 'react';
import api from '../config/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  currentMembers: number[];
}

export default function InviteUsersModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  currentMembers 
}: InviteUsersModalProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      const allUsers = response.data.users || [];
      
      // Filter out current members
      const available = allUsers.filter((user: User) => 
        !currentMembers.includes(user.id)
      );
      
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post(`/conversations/${conversationId}/invite`, {
        userIds: selectedUsers
      });
      
      onClose();
      window.location.reload(); // Refresh to show new members
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to invite users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Invite Users to Conversation
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mb-4">
          {availableUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No additional users available to invite
            </p>
          ) : (
            <div className="space-y-2">
              {availableUsers.map(user => (
                <label
                  key={user.id}
                  className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email} • {user.role}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading || selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}