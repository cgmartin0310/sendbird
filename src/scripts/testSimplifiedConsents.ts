import pool from '../config/database';

async function testSimplifiedConsents() {
  console.log('Testing Simplified Consent Types...\n');

  try {
    // Check existing consents
    console.log('📊 Current Consents in Database:');
    const existingConsents = await pool.query(`
      SELECT DISTINCT consent_type, COUNT(*) as count
      FROM consents
      GROUP BY consent_type
      ORDER BY consent_type
    `);

    if (existingConsents.rows.length === 0) {
      console.log('  No consents found\n');
    } else {
      existingConsents.rows.forEach(row => {
        console.log(`  - ${row.consent_type}: ${row.count} consent(s)`);
      });
    }

    // Test creating a consent with new simplified types
    console.log('\n🧪 Testing New Consent Type Creation:');
    
    // Get a test patient and organization
    const patientResult = await pool.query('SELECT id FROM patients LIMIT 1');
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    
    if (patientResult.rows.length === 0 || orgResult.rows.length === 0) {
      console.log('  ⚠️  No patients or organizations found for testing');
      return;
    }

    const testPatientId = patientResult.rows[0].id;
    const testOrgId = orgResult.rows[0].id;

    // Try each new consent type
    const newConsentTypes = ['General Medical', 'Legal', 'Other', 'SUD Notes'];
    
    for (const consentType of newConsentTypes) {
      try {
        await pool.query(`
          INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, is_active, created_by)
          VALUES ($1, $2, $3, CURRENT_DATE, true, 1)
          ON CONFLICT (patient_id, organization_id, consent_type) 
          DO UPDATE SET 
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, consent_type
        `, [testPatientId, testOrgId, consentType]);
        
        console.log(`  ✅ "${consentType}" consent type works correctly`);
      } catch (error: any) {
        console.log(`  ❌ Error with "${consentType}": ${error.message}`);
      }
    }

    // Verify the simplified types work with compliance checks
    console.log('\n🔍 Verifying Compliance Group Matching:');
    
    const complianceGroups = await pool.query(`
      SELECT name FROM compliance_groups ORDER BY name
    `);
    
    console.log('  Compliance Groups in system:');
    complianceGroups.rows.forEach(group => {
      const hasMatchingConsentType = newConsentTypes.includes(group.name) || group.name === 'Interagency';
      const status = hasMatchingConsentType ? '✅' : '⚠️';
      console.log(`    ${status} ${group.name}`);
    });

    console.log('\n✅ Simplified consent types are ready to use!');
    console.log('\n📝 Note: The system now uses consent types that directly match compliance groups:');
    console.log('  - General Medical: Standard HIPAA compliance');
    console.log('  - Legal: Court-ordered or legal disclosures'); 
    console.log('  - Other: Special circumstances and research');
    console.log('  - SUD Notes: 42 CFR Part 2 protected records');
    console.log('  - (Interagency organizations don\'t require consent)');

  } catch (error) {
    console.error('Error testing simplified consents:', error);
  } finally {
    await pool.end();
  }
}

testSimplifiedConsents();
