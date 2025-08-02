export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'peer_support' | 'care_team_member' | 'admin';
  organizationId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  medicalRecordNumber?: string;
  createdByOrganizationId: number;
  externalUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: number;
  name: string;
  complianceGroupId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceGroup {
  id: number;
  name: string;
  description: string;
  requires_consent: boolean;
  requires_organization_consent: boolean;
  organization_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: number;
  patientId: number;
  organizationId: number;
  specificOrganizationId?: number;
  consentType?: string;
  consentDate: string;
  expiryDate?: string;
  revoked: boolean;
  revokedAt?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  organization?: Organization;
  specificOrganization?: Organization;
  attachments?: ConsentAttachment[];
}

export interface ConsentAttachment {
  id: number;
  consentId: number;
  filename: string;
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  storagePath: string;
  uploadedBy: number;
  createdAt: string;
}

export interface Conversation {
  channelUrl: string;
  name: string;
  participantCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}