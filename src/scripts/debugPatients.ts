import pool from '../config/database';

async function debugPatients() {
  console.log('Debugging patient data...\n');
  
  try {
    // Check all patients
    const patientsResult = await pool.query(
      `SELECT id, first_name, last_name, email, created_at 
       FROM patients 
       ORDER BY created_at DESC`
    );
    
    console.log('All Patients in Database:');
    console.log('========================');
    if (patientsResult.rows.length === 0) {
      console.log('No patients found in database!');
    } else {
      patientsResult.rows.forEach(patient => {
        console.log(`ID: ${patient.id} - ${patient.first_name} ${patient.last_name} (${patient.email})`);
        console.log(`  Created: ${patient.created_at}`);
      });
    }
    
    // Check for John Doe specifically
    console.log('\nSearching for "John Doe":');
    console.log('========================');
    const johnDoeResult = await pool.query(
      `SELECT * FROM patients 
       WHERE LOWER(first_name) = 'john' AND LOWER(last_name) = 'doe'`
    );
    
    if (johnDoeResult.rows.length > 0) {
      console.log('Found John Doe:');
      console.log(johnDoeResult.rows[0]);
    } else {
      console.log('John Doe not found in database');
    }
    
    // Check consents for John Doe if found
    if (johnDoeResult.rows.length > 0) {
      const johnDoeId = johnDoeResult.rows[0].id;
      const consentsResult = await pool.query(
        `SELECT c.*, o.name as org_name 
         FROM consents c
         JOIN organizations o ON c.organization_id = o.id
         WHERE c.patient_id = $1`,
        [johnDoeId]
      );
      
      console.log(`\nConsents for John Doe (ID: ${johnDoeId}):`);
      console.log('=====================================');
      if (consentsResult.rows.length === 0) {
        console.log('No consents found');
      } else {
        consentsResult.rows.forEach(consent => {
          console.log(`- ${consent.org_name}: ${consent.consent_type} (Active: ${consent.is_active})`);
        });
      }
    }
    
    // Test the same query the API uses
    console.log('\nTesting API Query:');
    console.log('==================');
    const apiQueryResult = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM care_team_members ctm 
         JOIN care_teams ct ON ctm.care_team_id = ct.id 
         WHERE ct.patient_id = p.id) as care_team_size
      FROM patients p
      ORDER BY p.created_at DESC`
    );
    
    console.log(`API query returns ${apiQueryResult.rows.length} patients`);
    
  } catch (error) {
    console.error('Error debugging patients:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  debugPatients().catch(console.error);
}