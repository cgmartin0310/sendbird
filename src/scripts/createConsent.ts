import pool from '../config/database';

async function createConsent() {
  console.log('Creating consent for care team members...\n');
  
  try {
    // Get all care team members with organizations
    const careTeamResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.organization_id, o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.role = 'care_team_member' AND u.organization_id IS NOT NULL`
    );
    
    // Get all patients
    const patientsResult = await pool.query('SELECT id, first_name, last_name FROM patients');
    
    console.log(`Found ${careTeamResult.rows.length} care team members`);
    console.log(`Found ${patientsResult.rows.length} patients\n`);
    
    let consentCount = 0;
    
    for (const user of careTeamResult.rows) {
      console.log(`\nProcessing: ${user.first_name} ${user.last_name} (Org: ${user.org_name})`);
      
      for (const patient of patientsResult.rows) {
        // Check if consent already exists
        const existingConsent = await pool.query(
          `SELECT id FROM consents 
           WHERE patient_id = $1 AND organization_id = $2`,
          [patient.id, user.organization_id]
        );
        
        if (existingConsent.rows.length === 0) {
          // Create consent
          const result = await pool.query(
            `INSERT INTO consents (
              patient_id, 
              organization_id, 
              consent_type, 
              consent_date, 
              is_active,
              created_by
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              patient.id,
              user.organization_id,
              'General Medical', // Default consent type
              new Date(),
              true,
              1 // System/admin user
            ]
          );
          
          console.log(`  ✅ Created consent for patient: ${patient.first_name} ${patient.last_name}`);
          consentCount++;
        } else {
          // Update to ensure it's active
          await pool.query(
            `UPDATE consents 
             SET is_active = true, updated_at = CURRENT_TIMESTAMP 
             WHERE patient_id = $1 AND organization_id = $2`,
            [patient.id, user.organization_id]
          );
          console.log(`  ✓ Updated consent for patient: ${patient.first_name} ${patient.last_name}`);
        }
      }
    }
    
    console.log(`\n✅ Created/updated ${consentCount} consent records`);
    console.log('\nCare team members should now be able to join conversations!');
    
  } catch (error) {
    console.error('Error creating consent:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createConsent().catch(console.error);
}