import pool from '../config/database';

async function diagnoseConsentMismatch() {
  console.log('🔍 Diagnosing consent mismatch issue...\n');
  
  try {
    // 1. Check Care TeamMember's organization
    console.log('1. Care TeamMember (User ID 2) Details:');
    console.log('=========================================');
    const userResult = await pool.query(
      `SELECT u.*, o.name as org_name, o.id as org_id
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = 2`
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User ID 2 not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Name: ${user.first_name} ${user.last_name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Organization ID: ${user.organization_id}`);
    console.log(`Organization Name: ${user.org_name || 'NULL'}`);
    
    // 2. Check what organization "New Hanover Regional Medical Center" is
    console.log('\n2. New Hanover Regional Medical Center:');
    console.log('=========================================');
    const orgResult = await pool.query(
      `SELECT * FROM organizations WHERE name LIKE '%Hanover%' OR name LIKE '%Medical Center%'`
    );
    
    if (orgResult.rows.length > 0) {
      orgResult.rows.forEach(org => {
        console.log(`ID: ${org.id}, Name: ${org.name}`);
      });
    } else {
      console.log('Organization not found by that name.');
      console.log('\nAll organizations:');
      const allOrgs = await pool.query('SELECT id, name FROM organizations ORDER BY id');
      allOrgs.rows.forEach(org => {
        console.log(`  ID ${org.id}: ${org.name}`);
      });
    }
    
    // 3. Check Organization 11 specifically
    console.log('\n3. Organization ID 11:');
    console.log('=======================');
    const org11Result = await pool.query('SELECT * FROM organizations WHERE id = 11');
    if (org11Result.rows.length > 0) {
      const org11 = org11Result.rows[0];
      console.log(`Name: ${org11.name}`);
      console.log(`Compliance Group ID: ${org11.compliance_group_id}`);
    } else {
      console.log('Organization ID 11 does not exist!');
    }
    
    // 4. Check ALL consents for John Doe
    console.log('\n4. ALL Consents for John Doe (Patient ID 1):');
    console.log('==============================================');
    const consentResult = await pool.query(
      `SELECT c.*, o.name as org_name, u.email as created_by_email
       FROM consents c
       JOIN organizations o ON c.organization_id = o.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.patient_id = 1
       ORDER BY c.created_at DESC`
    );
    
    if (consentResult.rows.length > 0) {
      consentResult.rows.forEach((consent, idx) => {
        console.log(`\nConsent ${idx + 1}:`);
        console.log(`  ID: ${consent.id}`);
        console.log(`  Organization ID: ${consent.organization_id}`);
        console.log(`  Organization Name: ${consent.org_name}`);
        console.log(`  Type: ${consent.consent_type}`);
        console.log(`  Active: ${consent.is_active}`);
        console.log(`  Date: ${consent.consent_date}`);
        console.log(`  Created by: ${consent.created_by_email || 'System'}`);
      });
    } else {
      console.log('No consents found for John Doe!');
    }
    
    // 5. Check if there's a consent match
    console.log('\n5. Consent Match Check:');
    console.log('========================');
    const matchResult = await pool.query(
      `SELECT * FROM consents 
       WHERE patient_id = 1 
         AND organization_id = $1 
         AND is_active = true`,
      [user.organization_id]
    );
    
    if (matchResult.rows.length > 0) {
      console.log(`✅ FOUND MATCHING CONSENT!`);
      console.log(`   Consent exists for organization ID ${user.organization_id}`);
      console.log(`   This SHOULD allow Care TeamMember to join conversations.`);
      console.log('\n⚠️  POSSIBLE ISSUES:');
      console.log('   1. Sendbird user might not be synced');
      console.log('   2. There might be a caching issue');
      console.log('   3. The consent might have been created AFTER the conversation');
    } else {
      console.log(`❌ NO MATCHING CONSENT!`);
      console.log(`   Care TeamMember's org ID: ${user.organization_id}`);
      console.log(`   Consents exist for org IDs: ${consentResult.rows.map(c => c.organization_id).join(', ')}`);
      console.log('\n   MISMATCH: Care TeamMember is in a different organization than the consent!');
    }
    
    // 6. Test compliance check
    console.log('\n6. Testing Compliance Check:');
    console.log('=============================');
    const complianceTest = await pool.query(
      `SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM consents 
            WHERE patient_id = 1 
              AND organization_id = $1 
              AND is_active = true
              AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
          ) THEN 'COMPLIANT'
          ELSE 'NON-COMPLIANT'
        END as compliance_status`,
      [user.organization_id]
    );
    
    console.log(`Compliance Status: ${complianceTest.rows[0].compliance_status}`);
    
    // 7. Solution
    console.log('\n7. SOLUTION:');
    console.log('=============');
    if (matchResult.rows.length > 0) {
      console.log('✅ Consent exists! Try these steps:');
      console.log('   1. Run: npm run sync:sendbird-users');
      console.log('   2. Create a NEW conversation (existing ones won\'t update)');
      console.log('   3. Both users should appear in the new conversation');
    } else {
      console.log('❌ Organization mismatch! Options:');
      console.log(`   Option 1: Update Care TeamMember to the correct organization`);
      console.log(`   Option 2: Create a new consent for organization ID ${user.organization_id}`);
      console.log('\n   To update Care TeamMember\'s organization:');
      console.log(`   UPDATE users SET organization_id = [correct_org_id] WHERE id = 2;`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  diagnoseConsentMismatch().catch(console.error);
}

export default diagnoseConsentMismatch;
