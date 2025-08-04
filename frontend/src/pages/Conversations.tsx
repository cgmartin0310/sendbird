import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import UserSelector from '../components/UserSelector';

interface Conversation {
  id: number;
  sendbird_channel_url: string;
  title: string;
  created_at: string;
  created_by_user_id: number;
  patient_first_name: string;
  patient_last_name: string;
  is_compliant: boolean;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    patientId: '',
    memberIds: [] as number[],
    externalMembers: [] as { phoneNumber: string; name: string }[]
  });
  const [selectedAdditionalUsers, setSelectedAdditionalUsers] = useState<number[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [convResponse, patientResponse] = await Promise.all([
        api.get('/conversations'),
        api.get('/patients')
      ]);
      setConversations(convResponse.data.conversations);
      setPatients(patientResponse.data.patients);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    
    try {
      // Debug logging
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      
      const payload = {
        ...formData,
        patientId: parseInt(formData.patientId),
        memberIds: user?.id ? [user.id, ...selectedAdditionalUsers] : selectedAdditionalUsers
      };
      
      console.log('Sending payload:', payload);
      
      const response = await api.post('/conversations', payload);
      
      if (response.data.sendbirdChannelUrl) {
        navigate(`/chat/${response.data.sendbirdChannelUrl}`);
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      // Extract error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to create conversation. Please try again.';
      
      const errorDetails = error.response?.data?.details;
      
      setError(errorDetails ? `${errorMessage} ${errorDetails}` : errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChat = (channelUrl: string) => {
    navigate(`/chat/${channelUrl}`);
  };

  const handleDelete = async (conversationId: number) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await api.delete(`/conversations/${conversationId}`);
      // Remove from list
      setConversations(conversations.filter(c => c.id !== conversationId));
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          New Conversation
        </button>
      </div>

      {error && !showCreateForm && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Conversation</h2>
          
          {error && showCreateForm && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., John Doe - Care Coordination"
              />
            </div>
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
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Team Member Selection */}
            <div className="mt-4">
              <UserSelector
                selectedUsers={selectedAdditionalUsers}
                onChange={setSelectedAdditionalUsers}
                patientId={formData.patientId}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedAdditionalUsers([]);
                  setFormData({
                    title: '',
                    patientId: '',
                    memberIds: [],
                    externalMembers: []
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Conversation'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => handleOpenChat(conversation.sendbird_channel_url)}
                  className="flex-1 cursor-pointer hover:opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{conversation.title}</p>
                      <p className="text-sm text-gray-500">
                        Patient: {conversation.patient_first_name} {conversation.patient_last_name}
                      </p>
                    </div>
                    <div className="flex items-center mr-4">
                      {conversation.is_compliant ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Compliant
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Non-compliant
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Created: {new Date(conversation.created_at).toLocaleDateString()}
                  </div>
                </div>
                {(conversation.created_by_user_id === user?.id || user?.role === 'admin') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conversation.id);
                    }}
                    disabled={deletingId === conversation.id}
                    className="ml-4 p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md disabled:opacity-50"
                    title="Delete conversation"
                  >
                    {deletingId === conversation.id ? (
                      <span className="text-sm">Deleting...</span>
                    ) : (
                      <TrashIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Conversations;
