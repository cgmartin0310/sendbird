import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

async function quickFix() {
  console.log('Running quick database fix...\n');
  
  try {
    // 1. Drop existing constraint if it exists (to avoid errors)
    console.log('1. Cleaning up old constraints...');
    try {
      await pool.query('ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_name_unique');
      await pool.query('ALTER TABLE compliance_groups DROP CONSTRAINT IF EXISTS compliance_groups_name_unique');
    } catch (e) {
      // Ignore errors if constraints don't exist
    }
    
    // 2. Add UNIQUE constraint to organizations.name
    console.log('2. Adding UNIQUE constraint to organizations.name...');
    await pool.query('ALTER TABLE organizations ADD CONSTRAINT organizations_name_unique UNIQUE (name)');
    console.log('   ✓ Success');
    
    // 3. Add UNIQUE constraint to compliance_groups.name
    console.log('3. Adding UNIQUE constraint to compliance_groups.name...');
    await pool.query('ALTER TABLE compliance_groups ADD CONSTRAINT compliance_groups_name_unique UNIQUE (name)');
    console.log('   ✓ Success');
    
    // 4. Ensure default compliance group exists
    console.log('4. Ensuring default compliance group exists...');
    await pool.query(`
      INSERT INTO compliance_groups (name, description)
      VALUES ('Default Group', 'Default compliance group')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('   ✓ Success');
    
    console.log('\n✅ Database fix complete! Organization creation should work now.');
    
  } catch (error) {
    console.error('Error during quick fix:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

quickFix().catch(console.error);