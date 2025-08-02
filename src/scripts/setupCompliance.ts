import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

async function setupCompliance() {
  console.log('Setting up compliance data...\n');
  
  try {
    // 1. Create a compliance group
    console.log('1. Creating compliance group...');
    const complianceGroupResult = await pool.query(
      `INSERT INTO compliance_groups (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Default Healthcare Group', 'Standard HIPAA compliance group']
    );
    const complianceGroupId = complianceGroupResult.rows[0].id;
    console.log(`   ✓ Compliance group created (ID: ${complianceGroupId})`);
    
    // 2. Create an organization
    console.log('\n2. Creating organization...');
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, compliance_group_id)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET compliance_group_id = EXCLUDED.compliance_group_id
       RETURNING id`,
      ['Test Healthcare Organization', complianceGroupId]
    );
    const organizationId = orgResult.rows[0].id;
    console.log(`   ✓ Organization created (ID: ${organizationId})`);
    
    // 3. Update test user to belong to this organization
    console.log('\n3. Updating test user organization...');
    const userUpdateResult = await pool.query(
      `UPDATE users 
       SET organization_id = $1 
       WHERE email = $2
       RETURNING id, first_name, last_name`,
      [organizationId, 'test.user@healthcare.com']
    );
    
    if (userUpdateResult.rows.length > 0) {
      const user = userUpdateResult.rows[0];
      console.log(`   ✓ Updated user: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    } else {
      console.log('   ⚠ Test user not found. Please create it first.');
    }
    
    // 4. Get all patients
    console.log('\n4. Creating consent records for all patients...');
    const patientsResult = await pool.query(
      'SELECT id, first_name, last_name FROM patients'
    );
    
    if (patientsResult.rows.length === 0) {
      console.log('   ⚠ No patients found. Create patients first.');
    } else {
      for (const patient of patientsResult.rows) {
        // Create consent for each patient
        await pool.query(
          `INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, is_active)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (patient_id, organization_id, consent_type) 
           DO UPDATE SET 
             consent_date = EXCLUDED.consent_date,
             is_active = true,
             updated_at = CURRENT_TIMESTAMP`,
          [patient.id, organizationId, 'treatment', new Date(), true]
        );
        console.log(`   ✓ Created consent for patient: ${patient.first_name} ${patient.last_name}`);
      }
    }
    
    // 5. Create additional test users in the organization
    console.log('\n5. Creating additional test users...');
    const testUsers = [
      { email: 'doctor@healthcare.com', password: 'SecurePass123!', firstName: 'Dr. Sarah', lastName: 'Johnson', role: 'care_team_member' },
      { email: 'nurse@healthcare.com', password: 'SecurePass123!', firstName: 'Nancy', lastName: 'Williams', role: 'care_team_member' },
      { email: 'peer@healthcare.com', password: 'SecurePass123!', firstName: 'Peter', lastName: 'Smith', role: 'peer_support' }
    ];
    
    for (const userData of testUsers) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET organization_id = EXCLUDED.organization_id
         RETURNING id`,
        [userData.email, hashedPassword, userData.firstName, userData.lastName, userData.role, organizationId]
      );
      console.log(`   ✓ Created user: ${userData.email}`);
    }
    
    console.log('\n✅ Compliance setup complete!');
    console.log('\n📝 Summary:');
    console.log('   - Organization: Test Healthcare Organization');
    console.log('   - Users with access:');
    console.log('     • test.user@healthcare.com (Test User)');
    console.log('     • doctor@healthcare.com (Dr. Sarah Johnson)');
    console.log('     • nurse@healthcare.com (Nancy Williams)');
    console.log('     • peer@healthcare.com (Peter Smith)');
    console.log('   - All users can now create conversations with patients');
    console.log('   - Password for all users: SecurePass123!');
    
  } catch (error) {
    console.error('Error setting up compliance:', error);
  } finally {
    await pool.end();
  }
}

setupCompliance().catch(console.error);