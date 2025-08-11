import pool from '../config/database';

async function checkComplianceGroups() {
  console.log('Checking Compliance Groups in Database...\n');
  
  try {
    // Check what compliance groups exist
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        requires_consent,
        requires_organization_consent,
        created_at
      FROM compliance_groups
      ORDER BY id
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No compliance groups found in database!');
      console.log('\nTo fix this, run: npm run setup:compliance-groups');
    } else {
      console.log(`Found ${result.rows.length} compliance groups:\n`);
      
      result.rows.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name} (ID: ${group.id})`);
        console.log(`   Description: ${group.description}`);
        console.log(`   Requires Consent: ${group.requires_consent}`);
        console.log(`   Organization-Specific: ${group.requires_organization_consent}`);
        console.log(`   Created: ${new Date(group.created_at).toLocaleDateString()}\n`);
      });
      
      // Check if Interagency is missing
      const hasInteragency = result.rows.some(g => g.name === 'Interagency');
      if (!hasInteragency) {
        console.log('⚠️  WARNING: "Interagency" compliance group is missing!');
        console.log('This group is needed for government agencies that don\'t require consent.');
        console.log('\nTo add it, run: npm run setup:compliance-groups');
      }
    }
    
    // Check how many organizations use each group
    console.log('\n📊 Organization Usage:');
    const orgCount = await pool.query(`
      SELECT 
        cg.name as compliance_group,
        COUNT(o.id) as org_count
      FROM compliance_groups cg
      LEFT JOIN organizations o ON o.compliance_group_id = cg.id
      GROUP BY cg.id, cg.name
      ORDER BY cg.name
    `);
    
    orgCount.rows.forEach(row => {
      console.log(`   ${row.compliance_group}: ${row.org_count} organization(s)`);
    });
    
  } catch (error) {
    console.error('Error checking compliance groups:', error);
  } finally {
    await pool.end();
  }
}

checkComplianceGroups();
