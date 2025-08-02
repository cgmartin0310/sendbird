#!/bin/bash

# Create Patients page
cat > src/pages/Patients.tsx << 'EOFILE'
import { useState, useEffect } from 'react';
import api from '../config/api';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  risk_level?: string;
  care_team_size?: string;
  created_at: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    medicalRecordNumber: '',
    riskLevel: 'medium'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/patients', formData);
      setShowCreateForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        medicalRecordNumber: '',
        riskLevel: 'medium'
      });
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Patient
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Patient</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical Record Number</label>
                <input
                  type="text"
                  name="medicalRecordNumber"
                  value={formData.medicalRecordNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Level</label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Patient
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {patients.map((patient) => (
            <li key={patient.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    {patient.risk_level && (
                      <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(patient.risk_level)}`}>
                        {patient.risk_level} risk
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Care team: {patient.care_team_size || 0} members
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Added: {new Date(patient.created_at).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Patients;
EOFILE

# Create Conversations page
cat > src/pages/Conversations.tsx << 'EOFILE'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

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

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    patientId: '',
    memberIds: [] as number[],
    externalMembers: [] as { phoneNumber: string; name: string }[]
  });
  const navigate = useNavigate();

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
    try {
      const response = await api.post('/conversations', {
        ...formData,
        patientId: parseInt(formData.patientId),
        memberIds: [1, 2] // For demo, using hardcoded user IDs
      });
      
      if (response.data.sendbirdChannelUrl) {
        navigate(`/chat/${response.data.sendbirdChannelUrl}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
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
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Conversation
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
EOFILE

# Create Chat page with Sendbird UIKit
cat > src/pages/Chat.tsx << 'EOFILE'
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SendbirdApp from '@sendbird/uikit-react/App';
import '@sendbird/uikit-react/dist/index.css';

const Chat = () => {
  const { channelUrl } = useParams<{ channelUrl: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get Sendbird App ID from environment variable
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;

  if (!appId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Sendbird App ID is not configured. Please add VITE_SENDBIRD_APP_ID to your .env file.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id || !channelUrl) {
    return <div>Loading...</div>;
  }

  // Use the user's ID as the Sendbird user ID
  const userId = `user_${user.id}`;
  const nickname = `${user.firstName} ${user.lastName}`;

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/conversations')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Conversations
        </button>
        <h2 className="text-lg font-medium text-gray-900">Chat</h2>
      </div>
      <div className="flex-1">
        <SendbirdApp
          appId={appId}
          userId={userId}
          nickname={nickname}
          theme="light"
          channelUrl={channelUrl}
          showSearchIcon={false}
          replyType="QUOTE_REPLY"
          messageListParams={{
            prevResultSize: 20,
            includeReactions: true,
            includeMetaArray: true,
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
EOFILE

# Update App.css for Tailwind
cat > src/App.css << 'EOFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOFILE

# Update index.css
cat > src/index.css << 'EOFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Fix for Tailwind forms */
input, select, textarea {
  @apply border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500;
}
EOFILE

echo "All pages created successfully!"
