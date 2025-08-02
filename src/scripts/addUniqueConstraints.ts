import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

async function addUniqueConstraints() {
  console.log('Adding missing unique constraints...\n');
  
  try {
    // Add UNIQUE constraint to compliance_groups.name if it doesn't exist
    console.log('1. Checking compliance_groups.name constraint...');
    try {
      await pool.query(`
        ALTER TABLE compliance_groups 
        ADD CONSTRAINT compliance_groups_name_unique 
        UNIQUE (name)
      `);
      console.log('   ✓ Added UNIQUE constraint to compliance_groups.name');
    } catch (error: any) {
      if (error.code === '42710') { // Constraint already exists
        console.log('   ✓ UNIQUE constraint already exists on compliance_groups.name');
      } else {
        throw error;
      }
    }
    
    // Add UNIQUE constraint to organizations.name if needed
    console.log('\n2. Checking organizations.name constraint...');
    try {
      await pool.query(`
        ALTER TABLE organizations 
        ADD CONSTRAINT organizations_name_unique 
        UNIQUE (name)
      `);
      console.log('   ✓ Added UNIQUE constraint to organizations.name');
    } catch (error: any) {
      if (error.code === '42710') { // Constraint already exists
        console.log('   ✓ UNIQUE constraint already exists on organizations.name');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Unique constraints updated successfully!');
    
  } catch (error) {
    console.error('Error adding unique constraints:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addUniqueConstraints().catch(console.error);