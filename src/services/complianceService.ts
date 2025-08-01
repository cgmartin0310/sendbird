import pool from '../config/database';

interface ComplianceCheckResult {
  userId: number;
  isCompliant: boolean;
  reason?: string;
}

export class ComplianceService {
  /**
   * Check if a user's organization has the required consents for a patient
   */
  async checkUserCompliance(userId: number, patientId: number): Promise<ComplianceCheckResult> {
    try {
      // Get user's organization
      const userResult = await pool.query(
        `SELECT u.id, u.organization_id, o.compliance_group_id 
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          userId,
          isCompliant: false,
          reason: 'User not found'
        };
      }

      const user = userResult.rows[0];

      // External users (SMS) don't need compliance checks
      const externalUserResult = await pool.query(
        'SELECT is_external FROM users WHERE id = $1',
        [userId]
      );

      if (externalUserResult.rows[0]?.is_external) {
        return {
          userId,
          isCompliant: true,
          reason: 'External user - no compliance required'
        };
      }

      // If user has no organization, they can't be compliant
      if (!user.organization_id) {
        return {
          userId,
          isCompliant: false,
          reason: 'User has no associated organization'
        };
      }

      // Check if there's an active consent for this patient and organization
      const consentResult = await pool.query(
        `SELECT id, consent_type, expiry_date 
         FROM consents 
         WHERE patient_id = $1 
           AND organization_id = $2 
           AND is_active = true 
           AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)`,
        [patientId, user.organization_id]
      );

      if (consentResult.rows.length === 0) {
        return {
          userId,
          isCompliant: false,
          reason: 'No active consent found for organization'
        };
      }

      return {
        userId,
        isCompliant: true,
        reason: 'Valid consent on file'
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return {
        userId,
        isCompliant: false,
        reason: 'Error checking compliance'
      };
    }
  }

  /**
   * Check compliance for multiple users
   */
  async checkMultipleUsersCompliance(
    userIds: number[],
    patientId: number
  ): Promise<ComplianceCheckResult[]> {
    const results = await Promise.all(
      userIds.map(userId => this.checkUserCompliance(userId, patientId))
    );
    return results;
  }

  /**
   * Create a new consent record
   */
  async createConsent(
    patientId: number,
    organizationId: number,
    consentType: string,
    consentDate: Date,
    expiryDate?: Date
  ): Promise<number> {
    const result = await pool.query(
      `INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, expiry_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (patient_id, organization_id, consent_type) 
       DO UPDATE SET 
         consent_date = EXCLUDED.consent_date,
         expiry_date = EXCLUDED.expiry_date,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [patientId, organizationId, consentType, consentDate, expiryDate]
    );
    return result.rows[0].id;
  }

  /**
   * Revoke a consent
   */
  async revokeConsent(consentId: number): Promise<void> {
    await pool.query(
      `UPDATE consents 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [consentId]
    );
  }

  /**
   * Get all consents for a patient
   */
  async getPatientConsents(patientId: number) {
    const result = await pool.query(
      `SELECT c.*, o.name as organization_name 
       FROM consents c
       JOIN organizations o ON c.organization_id = o.id
       WHERE c.patient_id = $1
       ORDER BY c.created_at DESC`,
      [patientId]
    );
    return result.rows;
  }
}

export default new ComplianceService(); 