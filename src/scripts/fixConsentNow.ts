import pool from '../config/database';

async function fixConsentNow() {
  console.log('🔧 Emergency fix for consent creation...');
  
  try {
    // Add created_by column if missing
    console.log('\n1. Adding created_by column...');
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents ADD COLUMN created_by INTEGER;
          RAISE NOTICE 'Added created_by column';
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column created_by already exists';
        END;
        
        BEGIN
          ALTER TABLE consents 
          ADD CONSTRAINT fk_consents_created_by 
          FOREIGN KEY (created_by) 
          REFERENCES users(id) ON DELETE SET NULL;
          RAISE NOTICE 'Added foreign key constraint';
        EXCEPTION
          WHEN duplicate_object THEN 
            RAISE NOTICE 'Foreign key constraint already exists';
        END;
      END $$;
    `);
    console.log('✅ Created_by column ready');
    
    // Check if organization 11 exists
    console.log('\n2. Checking organization 11...');
    const orgCheck = await pool.query('SELECT id, name, compliance_group_id FROM organizations WHERE id = 11');
    if (orgCheck.rows.length === 0) {
      console.log('❌ Organization 11 does not exist!');
      console.log('Available organizations:');
      const orgs = await pool.query('SELECT id, name FROM organizations ORDER BY id');
      orgs.rows.forEach(org => console.log(`  - ID ${org.id}: ${org.name}`));
    } else {
      console.log(`✅ Organization 11 exists: ${orgCheck.rows[0].name}`);
      
      // Check compliance group
      const cgCheck = await pool.query(`
        SELECT cg.* FROM compliance_groups cg
        JOIN organizations o ON o.compliance_group_id = cg.id
        WHERE o.id = 11
      `);
      if (cgCheck.rows.length > 0) {
        const cg = cgCheck.rows[0];
        console.log(`   Compliance Group: ${cg.name}`);
        console.log(`   Requires Consent: ${cg.requires_consent}`);
        console.log(`   Requires Org Consent: ${cg.requires_organization_consent}`);
      }
    }
    
    // Check patient 1 exists
    console.log('\n3. Checking patient 1...');
    const patientCheck = await pool.query('SELECT id, first_name, last_name FROM patients WHERE id = 1');
    if (patientCheck.rows.length === 0) {
      console.log('❌ Patient 1 does not exist!');
    } else {
      console.log(`✅ Patient 1 exists: ${patientCheck.rows[0].first_name} ${patientCheck.rows[0].last_name}`);
    }
    
    // Show current consents table schema
    console.log('\n4. Current consents table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'consents'
      ORDER BY ordinal_position
    `);
    
    schemaResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check constraints
    console.log('\n5. Checking constraints on consents table:');
    const constraintCheck = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'consents'
    `);
    constraintCheck.rows.forEach(c => {
      console.log(`   - ${c.constraint_name}: ${c.constraint_type}`);
    });
    
    console.log('\n✅ Database is ready for consent creation!');
    console.log('\nTry creating consent again with the frontend.');
    
  } catch (error) {
    console.error('Error in emergency fix:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixConsentNow().catch(console.error);
}

export default fixConsentNow;
