import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import complianceService from '../services/complianceService';

export const createComplianceGroupValidation = [
  body('name').notEmpty().withMessage('Compliance group name is required'),
  body('description').optional().isString()
];

export const createConsentValidation = [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('organizationId').isInt().withMessage('Valid organization ID is required'),
  body('consentType').notEmpty().withMessage('Consent type is required'),
  body('consentDate').isISO8601().withMessage('Valid consent date is required'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required')
];

export const createComplianceGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, description } = req.body;

    const result = await pool.query(
      `INSERT INTO compliance_groups (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );

    res.status(201).json({ complianceGroup: result.rows[0] });
  } catch (error) {
    console.error('Create compliance group error:', error);
    res.status(500).json({ error: 'Failed to create compliance group' });
  }
};

export const listComplianceGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT cg.*,
              (SELECT COUNT(*) FROM organizations WHERE compliance_group_id = cg.id) as organization_count
       FROM compliance_groups cg
       ORDER BY cg.name ASC`
    );

    res.json({ complianceGroups: result.rows });
  } catch (error) {
    console.error('List compliance groups error:', error);
    res.status(500).json({ error: 'Failed to list compliance groups' });
  }
};

export const createConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientId, organizationId, consentType, consentDate, expiryDate } = req.body;

    // Verify patient exists
    const patientCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientCheck.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Verify organization exists
    const orgCheck = await pool.query(
      'SELECT id FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgCheck.rows.length === 0) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const consentId = await complianceService.createConsent(
      patientId,
      organizationId,
      consentType,
      new Date(consentDate),
      expiryDate ? new Date(expiryDate) : undefined
    );

    const result = await pool.query(
      'SELECT * FROM consents WHERE id = $1',
      [consentId]
    );

    res.status(201).json({ consent: result.rows[0] });
  } catch (error) {
    console.error('Create consent error:', error);
    res.status(500).json({ error: 'Failed to create consent' });
  }
};

export const getPatientConsents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);

    const consents = await complianceService.getPatientConsents(patientId);

    res.json({ consents });
  } catch (error) {
    console.error('Get patient consents error:', error);
    res.status(500).json({ error: 'Failed to get patient consents' });
  }
};

export const revokeConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consentId = parseInt(req.params.id);

    // Verify consent exists and user has permission
    const consentCheck = await pool.query(
      'SELECT * FROM consents WHERE id = $1',
      [consentId]
    );

    if (consentCheck.rows.length === 0) {
      res.status(404).json({ error: 'Consent not found' });
      return;
    }

    await complianceService.revokeConsent(consentId);

    res.json({ message: 'Consent revoked successfully' });
  } catch (error) {
    console.error('Revoke consent error:', error);
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
}; 