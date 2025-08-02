import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

async function diagnoseDb() {
  console.log('Diagnosing database state...\n');
  
  try {
    // 1. Check organizations table structure
    console.log('1. Organizations table constraints:');
    const orgConstraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'organizations'
    `);
    console.log(orgConstraints.rows);
    
    // 2. Check compliance_groups table
    console.log('\n2. Compliance groups table constraints:');
    const cgConstraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'compliance_groups'
    `);
    console.log(cgConstraints.rows);
    
    // 3. Check if any compliance groups exist
    console.log('\n3. Existing compliance groups:');
    const groups = await pool.query('SELECT * FROM compliance_groups');
    console.log(`Found ${groups.rows.length} compliance groups:`);
    groups.rows.forEach(g => console.log(`  - ID: ${g.id}, Name: ${g.name}`));
    
    // 4. Check existing organizations
    console.log('\n4. Existing organizations:');
    const orgs = await pool.query('SELECT * FROM organizations');
    console.log(`Found ${orgs.rows.length} organizations:`);
    orgs.rows.forEach(o => console.log(`  - ID: ${o.id}, Name: ${o.name}, Compliance Group: ${o.compliance_group_id}`));
    
    // 5. Test creating a compliance group
    console.log('\n5. Testing compliance group creation:');
    try {
      const testGroup = await pool.query(
        `INSERT INTO compliance_groups (name, description) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Test Group ' + Date.now(), 'Test group for diagnosis']
      );
      console.log('✓ Successfully created test group:', testGroup.rows[0]);
    } catch (e: any) {
      console.log('✗ Failed to create test group:', e.message);
    }
    
    // 6. Check column data types
    console.log('\n6. Column information:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name IN ('organizations', 'compliance_groups')
      ORDER BY table_name, ordinal_position
    `);
    console.log('Table columns:');
    columns.rows.forEach(c => console.log(`  ${c.table_name}.${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`));
    
  } catch (error) {
    console.error('Diagnosis error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseDb().catch(console.error);