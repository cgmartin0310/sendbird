import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';

export const createPatientValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('medicalRecordNumber').optional().isString(),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical'])
];

export const updatePatientValidation = [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('dateOfBirth').optional().isISO8601(),
  body('medicalRecordNumber').optional().isString(),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical'])
];

export const createCareTeamValidation = [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('name').notEmpty().withMessage('Care team name is required')
];

export const addCareTeamMemberValidation = [
  body('userId').isInt().withMessage('Valid user ID is required'),
  body('role').optional().isString()
];

export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { firstName, lastName, dateOfBirth, medicalRecordNumber, riskLevel } = req.body;

    const result = await pool.query(
      `INSERT INTO patients (first_name, last_name, date_of_birth, medical_record_number, risk_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [firstName, lastName, dateOfBirth, medicalRecordNumber, riskLevel]
    );

    res.status(201).json({ patient: result.rows[0] });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const listPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let query = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM care_team_members ctm 
         JOIN care_teams ct ON ctm.care_team_id = ct.id 
         WHERE ct.patient_id = p.id) as care_team_size
      FROM patients p
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER($1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ patients: result.rows });
  } catch (error) {
    console.error('List patients error:', error);
    res.status(500).json({ error: 'Failed to list patients' });
  }
};

export const getPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id);

    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [patientId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ patient: result.rows[0] });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to get patient' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const patientId = parseInt(req.params.id);
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const setClause = fields.map((field, index) => {
      const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${snakeCase} = $${index + 2}`;
    }).join(', ');

    const query = `
      UPDATE patients 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [patientId, ...values]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ patient: result.rows[0] });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const createCareTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientId, name } = req.body;

    // Check if patient exists
    const patientCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientCheck.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO care_teams (patient_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [patientId, name]
    );

    res.status(201).json({ careTeam: result.rows[0] });
  } catch (error) {
    console.error('Create care team error:', error);
    res.status(500).json({ error: 'Failed to create care team' });
  }
};

export const getPatientCareTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);

    const teamResult = await pool.query(
      'SELECT * FROM care_teams WHERE patient_id = $1',
      [patientId]
    );

    if (teamResult.rows.length === 0) {
      res.json({ careTeam: null, members: [] });
      return;
    }

    const careTeam = teamResult.rows[0];

    const membersResult = await pool.query(
      `SELECT ctm.*, u.first_name, u.last_name, u.email, u.role as user_role,
              o.name as organization_name
       FROM care_team_members ctm
       JOIN users u ON ctm.user_id = u.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE ctm.care_team_id = $1`,
      [careTeam.id]
    );

    res.json({
      careTeam,
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get patient care team error:', error);
    res.status(500).json({ error: 'Failed to get care team' });
  }
};

export const addCareTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const careTeamId = parseInt(req.params.id);
    const { userId, role } = req.body;

    // Check if care team exists
    const teamCheck = await pool.query(
      'SELECT id FROM care_teams WHERE id = $1',
      [careTeamId]
    );

    if (teamCheck.rows.length === 0) {
      res.status(404).json({ error: 'Care team not found' });
      return;
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO care_team_members (care_team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (care_team_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [careTeamId, userId, role]
    );

    res.status(201).json({ member: result.rows[0] });
  } catch (error) {
    console.error('Add care team member error:', error);
    res.status(500).json({ error: 'Failed to add care team member' });
  }
}; 