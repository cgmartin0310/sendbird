import { useAuth } from '../contexts/AuthContext';

export default function UserDebug() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">User Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Current User Object:</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Key Information:</h3>
        <ul className="space-y-1">
          <li>User ID: <strong>{user?.id || 'NOT FOUND'}</strong></li>
          <li>Email: {user?.email}</li>
          <li>Name: {user?.firstName} {user?.lastName}</li>
          <li>Role: {user?.role}</li>
          <li>Organization ID: {user?.organizationId}</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">localStorage Data:</h3>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify({
            authToken: localStorage.getItem('authToken') ? 'Present' : 'Missing',
            user: localStorage.getItem('user')
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}