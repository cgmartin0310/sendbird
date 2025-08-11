import pool from '../config/database';

async function fixInteragencyGroup() {
  console.log('Adding Interagency Compliance Group...\n');
  
  try {
    // Check if Interagency already exists
    const existing = await pool.query(
      "SELECT id, name FROM compliance_groups WHERE name = 'Interagency'"
    );
    
    if (existing.rows.length > 0) {
      console.log('✅ Interagency group already exists (ID: ' + existing.rows[0].id + ')');
      return;
    }
    
    // Add Interagency compliance group
    const result = await pool.query(
      `INSERT INTO compliance_groups (name, description, requires_consent, requires_organization_consent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE
       SET description = EXCLUDED.description,
           requires_consent = EXCLUDED.requires_consent,
           requires_organization_consent = EXCLUDED.requires_organization_consent,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        'Interagency',
        'For government and interagency communications. No patient consent required.',
        false,  // Does NOT require consent
        false   // Not organization-specific
      ]
    );
    
    console.log('✅ Successfully added Interagency compliance group!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Name:', result.rows[0].name);
    console.log('   Description:', result.rows[0].description);
    console.log('   Requires Consent:', result.rows[0].requires_consent);
    console.log('   Organization-Specific:', result.rows[0].requires_organization_consent);
    
    // Show all compliance groups
    console.log('\n📋 All Compliance Groups:');
    const allGroups = await pool.query(
      'SELECT name, requires_consent FROM compliance_groups ORDER BY name'
    );
    
    allGroups.rows.forEach(group => {
      const consentIcon = group.requires_consent ? '✅' : '❌';
      console.log(`   ${group.name}: Consent Required ${consentIcon}`);
    });
    
    console.log('\n🎯 You can now assign organizations to the Interagency group.');
    console.log('   Organizations in this group do NOT need patient consent for messaging.');
    
  } catch (error) {
    console.error('Error adding Interagency group:', error);
  } finally {
    await pool.end();
  }
}

fixInteragencyGroup();
