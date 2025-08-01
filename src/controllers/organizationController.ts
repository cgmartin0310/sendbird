import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';

export const createOrganizationValidation = [
  body('name').notEmpty().withMessage('Organization name is required'),
  body('complianceGroupId').optional().isInt().withMessage('Valid compliance group ID is required')
];

export const createOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, complianceGroupId } = req.body;

    // Check if compliance group exists (if provided)
    if (complianceGroupId) {
      const groupCheck = await pool.query(
        'SELECT id FROM compliance_groups WHERE id = $1',
        [complianceGroupId]
      );

      if (groupCheck.rows.length === 0) {
        res.status(400).json({ error: 'Compliance group not found' });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO organizations (name, compliance_group_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, complianceGroupId]
    );

    res.status(201).json({ organization: result.rows[0] });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

export const listOrganizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*, cg.name as compliance_group_name,
              (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as member_count
       FROM organizations o
       LEFT JOIN compliance_groups cg ON o.compliance_group_id = cg.id
       ORDER BY o.name ASC`
    );

    res.json({ organizations: result.rows });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
};

export const getOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = parseInt(req.params.id);

    const orgResult = await pool.query(
      `SELECT o.*, cg.name as compliance_group_name
       FROM organizations o
       LEFT JOIN compliance_groups cg ON o.compliance_group_id = cg.id
       WHERE o.id = $1`,
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    // Get organization members
    const membersResult = await pool.query(
      `SELECT id, email, first_name, last_name, role, created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY last_name, first_name`,
      [organizationId]
    );

    res.json({
      organization: orgResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
}; 