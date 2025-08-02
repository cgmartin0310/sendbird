import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as conversationController from '../controllers/conversationController';
import * as patientController from '../controllers/patientController';
import * as organizationController from '../controllers/organizationController';
import * as complianceController from '../controllers/complianceController';
import * as adminController from '../controllers/adminController';
import * as uploadController from '../controllers/uploadController';

const router = Router();

// Health check
router.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.post('/auth/register', authController.registerValidation, authController.register);
router.post('/auth/login', authController.loginValidation, authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);

// Conversation routes
router.post(
  '/conversations',
  authenticate,
  authorize(['peer_support', 'care_team_member']),
  conversationController.createConversationValidation,
  conversationController.createConversation
);
router.get('/conversations', authenticate, conversationController.listConversations);
router.get('/conversations/:id', authenticate, conversationController.getConversationDetails);
router.post('/conversations/send-message', authenticate, conversationController.sendMessage);

// Patient routes
router.post(
  '/patients',
  authenticate,
  authorize(['peer_support', 'admin']),
  patientController.createPatientValidation,
  patientController.createPatient
);
router.get('/patients', authenticate, patientController.listPatients);
router.get('/patients/:id', authenticate, patientController.getPatient);
router.put(
  '/patients/:id',
  authenticate,
  authorize(['peer_support', 'admin']),
  patientController.updatePatientValidation,
  patientController.updatePatient
);

// Organization routes
router.post(
  '/organizations',
  authenticate,
  authorize(['admin']),
  organizationController.createOrganizationValidation,
  organizationController.createOrganization
);
router.get('/organizations', authenticate, organizationController.listOrganizations);
router.get('/organizations/:id', authenticate, organizationController.getOrganization);

// Compliance routes
router.post(
  '/compliance-groups',
  authenticate,
  authorize(['admin']),
  complianceController.createComplianceGroupValidation,
  complianceController.createComplianceGroup
);
router.get('/compliance-groups', authenticate, complianceController.listComplianceGroups);
router.post(
  '/consents',
  authenticate,
  authorize(['peer_support', 'admin']),
  complianceController.createConsentValidation,
  complianceController.createConsent
);
router.get('/patients/:patientId/consents', authenticate, complianceController.getPatientConsents);
router.delete(
  '/consents/:id',
  authenticate,
  authorize(['peer_support', 'admin']),
  complianceController.revokeConsent
);

// Care team routes
router.post(
  '/care-teams',
  authenticate,
  authorize(['peer_support', 'admin']),
  patientController.createCareTeamValidation,
  patientController.createCareTeam
);
router.get('/patients/:patientId/care-team', authenticate, patientController.getPatientCareTeam);
router.post(
  '/care-teams/:id/members',
  authenticate,
  authorize(['peer_support', 'admin']),
  patientController.addCareTeamMemberValidation,
  patientController.addCareTeamMember
);

// Admin routes
router.get('/admin/dashboard', authenticate, authorize(['admin']), adminController.getDashboardStats);

// Admin user management
router.get('/admin/users', authenticate, authorize(['admin']), adminController.listUsers);
router.post(
  '/admin/users',
  authenticate,
  authorize(['admin']),
  adminController.createUserValidation,
  adminController.createUser
);
router.put('/admin/users/:id', authenticate, authorize(['admin']), adminController.updateUser);

// Admin organization management
router.get('/admin/organizations', authenticate, authorize(['admin']), adminController.listOrganizations);
router.post(
  '/admin/organizations',
  authenticate,
  authorize(['admin']),
  adminController.createOrganizationValidation,
  adminController.createOrganization
);

// Admin consent management
router.get('/admin/consents', authenticate, authorize(['admin']), adminController.listConsents);
router.post(
  '/admin/consents',
  authenticate,
  authorize(['admin']),
  adminController.createConsentValidation,
  adminController.createConsent
);
router.delete('/admin/consents/:id', authenticate, authorize(['admin']), adminController.revokeConsent);

// Upload routes
router.post('/consents/attachments', authenticate, uploadController.uploadConsentAttachment);
router.get('/consents/:consentId/attachments', authenticate, uploadController.getConsentAttachments);
router.get('/attachments/:id/download', authenticate, uploadController.downloadAttachment);

// Webhook routes (no auth required)
router.post('/webhooks/sendbird', (req: any, res: any) => {
  // TODO: Implement Sendbird webhook handler
  console.log('Sendbird webhook received:', req.body);
  res.status(200).send('OK');
});

export default router; 