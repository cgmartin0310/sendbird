import pool from '../config/database';

async function checkAndFixConsent() {
  console.log('Checking consent status for care team members...\n');
  
  try {
    // Get all care team members
    const careTeamResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.organization_id, o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.role = 'care_team_member'`
    );
    
    console.log('Care Team Members:');
    console.log('==================');
    for (const user of careTeamResult.rows) {
      console.log(`\nUser: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`Organization: ${user.org_name || 'None'} (ID: ${user.organization_id || 'N/A'})`);
      
      if (!user.organization_id) {
        console.log('⚠️  No organization assigned - cannot have consent');
        continue;
      }
      
      // Check consent for each patient
      const patientsResult = await pool.query('SELECT id, first_name, last_name FROM patients');
      
      for (const patient of patientsResult.rows) {
        const consentCheck = await pool.query(
          `SELECT id, consent_type, is_active, expiry_date 
           FROM consents 
           WHERE patient_id = $1 
             AND organization_id = $2 
             AND is_active = true 
             AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)`,
          [patient.id, user.organization_id]
        );
        
        if (consentCheck.rows.length === 0) {
          console.log(`  ❌ No consent for patient: ${patient.first_name} ${patient.last_name}`);
        } else {
          console.log(`  ✅ Has consent for patient: ${patient.first_name} ${patient.last_name}`);
        }
      }
    }
    
    // Option to create missing consents
    console.log('\n\nTo create consent for care team members, run:');
    console.log('npm run create:consent\n');
    
  } catch (error) {
    console.error('Error checking consent:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkAndFixConsent().catch(console.error);
}