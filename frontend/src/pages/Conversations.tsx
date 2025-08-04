import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import UserSelector from '../components/UserSelector';

interface Conversation {
  id: number;
  sendbird_channel_url: string;
  title: string;
  created_at: string;
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

      {showCreateForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Conversation</h2>
          
          {error && (
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
            
            <UserSelector
              selectedUsers={selectedAdditionalUsers}
              onChange={setSelectedAdditionalUsers}
              patientId={formData.patientId}
            />
            
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
            <li key={conversation.id}>
              <button
                onClick={() => handleOpenChat(conversation.sendbird_channel_url)}
                className="w-full px-4 py-4 sm:px-6 hover:bg-gray-50 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{conversation.title}</p>
                    <p className="text-sm text-gray-500">
                      Patient: {conversation.patient_first_name} {conversation.patient_last_name}
                    </p>
                  </div>
                  <div className="flex items-center">
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
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Conversations;
