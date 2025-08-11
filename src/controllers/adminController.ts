import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

// Admin-only endpoints
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get counts for dashboard
    const [users, patients, conversations, organizations] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users WHERE NOT is_external'),
      pool.query('SELECT COUNT(*) as count FROM patients'),
      pool.query('SELECT COUNT(*) as count FROM conversations'),
      pool.query('SELECT COUNT(*) as count FROM organizations')
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      patients: parseInt(patients.rows[0].count),
      conversations: parseInt(conversations.rows[0].count),
      organizations: parseInt(organizations.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// User Management
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
              u.created_at, u.is_external, o.name as organization_name
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE NOT u.is_external
       ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

// List all users (for user selection in conversations)
export const listAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, organization_id
       FROM users 
       WHERE (is_external = false OR is_external IS NULL)
       AND role IN ('care_team_member', 'admin')
       ORDER BY first_name, last_name`
    );
    
    res.json({ 
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id
      }))
    });
  } catch (error) {
    console.error('Error listing all users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['peer_support', 'care_team_member', 'admin']).withMessage('Valid role is required'),
  body('organizationId').optional().isInt()
];

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, role, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, organization_id`,
      [email, passwordHash, firstName, lastName, role, organizationId || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, role, organizationId } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, role = $3, organization_id = $4
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, organization_id`,
      [firstName, lastName, role, organizationId || null, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Organization Management
export const listOrganizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.created_at, 
              cg.name as compliance_group_name,
              COUNT(DISTINCT u.id) as user_count
       FROM organizations o
       LEFT JOIN compliance_groups cg ON o.compliance_group_id = cg.id
       LEFT JOIN users u ON u.organization_id = o.id
       GROUP BY o.id, o.name, o.created_at, cg.name
       ORDER BY o.created_at DESC`
    );

    res.json({ organizations: result.rows });
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
};

export const createOrganizationValidation = [
  body('name').notEmpty().withMessage('Organization name is required'),
  body('complianceGroupId').optional().isInt()
];

export const createOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, complianceGroupId } = req.body;

    // Create default compliance group if none specified
    let groupId = complianceGroupId;
    if (!groupId) {
      // First try to find existing default group
      const existingGroup = await pool.query(
        'SELECT id FROM compliance_groups WHERE name = $1',
        ['Default Group']
      );
      
      if (existingGroup.rows.length > 0) {
        groupId = existingGroup.rows[0].id;
      } else {
        // Create new default group
        const defaultGroup = await pool.query(
          `INSERT INTO compliance_groups (name, description)
           VALUES ($1, $2)
           RETURNING id`,
          ['Default Group', 'Default compliance group']
        );
        groupId = defaultGroup.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO organizations (name, compliance_group_id)
       VALUES ($1, $2)
       RETURNING id, name, compliance_group_id`,
      [name, groupId]
    );

    res.status(201).json({ organization: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      res.status(400).json({ error: 'An organization with this name already exists' });
      return;
    }
    
    // Check for foreign key constraint violation
    if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid compliance group ID' });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to create organization',
      details: error.message 
    });
  }
};

// Consent Management
export const listConsents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.consent_type, c.consent_date, c.expiry_date, c.is_active,
              p.first_name as patient_first_name, p.last_name as patient_last_name,
              o.name as organization_name
       FROM consents c
       JOIN patients p ON c.patient_id = p.id
       JOIN organizations o ON c.organization_id = o.id
       ORDER BY c.created_at DESC
       LIMIT 100`
    );

    res.json({ consents: result.rows });
  } catch (error) {
    console.error('Error listing consents:', error);
    res.status(500).json({ error: 'Failed to list consents' });
  }
};

export const createConsentValidation = [
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('organizationId').isInt().withMessage('Organization ID is required'),
  body('consentType').notEmpty().withMessage('Consent type is required'),
  body('consentDate').isISO8601().withMessage('Valid consent date is required'),
  body('expiryDate').optional().isISO8601(),
  body('specificOrganizationId').optional().isInt().withMessage('Specific organization ID must be an integer')
];

export const createConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientId, organizationId, consentType, consentDate, expiryDate, specificOrganizationId } = req.body;
    const userId = req.user!.id;

    // Handle General Medical consent (no organization required)
    if (consentType === 'General Medical') {
      const result = await pool.query(
        `INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, expiry_date, created_by, specific_organization_id)
         VALUES ($1, NULL, $2, $3, $4, $5, NULL)
         ON CONFLICT (patient_id, organization_id, consent_type) 
         DO UPDATE SET 
           consent_date = EXCLUDED.consent_date,
           expiry_date = EXCLUDED.expiry_date,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [patientId, consentType, consentDate, expiryDate || null, userId]
      );

      res.status(201).json({ consent: result.rows[0] });
      return;
    }

    // For non-General Medical consents, require organization
    if (!organizationId) {
      res.status(400).json({ error: 'Organization is required for non-General Medical consents' });
      return;
    }

    // First check if this compliance group requires organization-specific consent
    const complianceCheck = await pool.query(
      `SELECT cg.name, cg.requires_consent, cg.requires_organization_consent 
       FROM organizations o
       JOIN compliance_groups cg ON o.compliance_group_id = cg.id
       WHERE o.id = $1`,
      [organizationId]
    );

    if (complianceCheck.rows.length === 0) {
      res.status(400).json({ error: 'Invalid organization' });
      return;
    }

    const complianceGroup = complianceCheck.rows[0];
    
    // Check if consent is required at all
    if (!complianceGroup.requires_consent) {
      res.status(400).json({ error: 'This compliance group does not require consent' });
      return;
    }

    // Check if organization-specific consent is required
    if (complianceGroup.requires_organization_consent && !specificOrganizationId) {
      res.status(400).json({ error: 'This compliance group requires organization-specific consent' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, expiry_date, created_by, specific_organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (patient_id, organization_id, consent_type) 
       DO UPDATE SET 
         consent_date = EXCLUDED.consent_date,
         expiry_date = EXCLUDED.expiry_date,
         specific_organization_id = EXCLUDED.specific_organization_id,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [patientId, organizationId, consentType || complianceGroup.name, consentDate, expiryDate || null, userId, specificOrganizationId || null]
    );

    res.status(201).json({ consent: result.rows[0] });
  } catch (error) {
    console.error('Error creating consent:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
};

export const revokeConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consentId = parseInt(req.params.id);

    const result = await pool.query(
      `UPDATE consents 
       SET is_active = false 
       WHERE id = $1
       RETURNING id`,
      [consentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Consent not found' });
      return;
    }

    res.json({ message: 'Consent revoked successfully' });
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
};