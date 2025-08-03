import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Conversations from './pages/Conversations';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrganizations from './pages/AdminOrganizations';
import AdminConsents from './pages/AdminConsents';
import AdminComplianceGroups from './pages/AdminComplianceGroups';
import UserDebug from './pages/UserDebug';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="chat/:channelUrl" element={<Chat />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/organizations" element={<AdminOrganizations />} />
            <Route path="admin/consents" element={<AdminConsents />} />
            <Route path="admin/compliance-groups" element={<AdminComplianceGroups />} />
            <Route path="debug/user" element={<UserDebug />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
