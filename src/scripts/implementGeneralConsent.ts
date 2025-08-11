import pool from '../config/database';

async function implementGeneralConsent() {
  console.log('Implementing General Medical Consent System...\n');
  
  try {
    // Step 1: Make organization_id optional for General Medical consents
    console.log('1. Updating database schema...');
    
    // First, check if we can safely make organization_id nullable
    const existingConsents = await pool.query(`
      SELECT consent_type, COUNT(*) as count
      FROM consents 
      WHERE consent_type = 'General Medical'
      GROUP BY consent_type
    `);
    
    console.log(`   Found ${existingConsents.rows[0]?.count || 0} existing General Medical consents`);
    
    // Make organization_id nullable
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents ALTER COLUMN organization_id DROP NOT NULL;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END $$;
    `);
    
    console.log('   ✅ Made organization_id nullable');
    
    // Step 2: Add constraint to ensure only General Medical can have NULL organization_id
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents DROP CONSTRAINT IF EXISTS check_org_required;
        EXCEPTION
          WHEN undefined_object THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE consents ADD CONSTRAINT check_org_required 
          CHECK (
            (consent_type = 'General Medical' AND organization_id IS NULL) OR
            (consent_type != 'General Medical' AND organization_id IS NOT NULL)
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END $$;
    `);
    
    console.log('   ✅ Added constraint: only General Medical can have NULL organization_id');
    
    // Step 3: Update existing General Medical consents to have NULL organization_id
    console.log('\n2. Updating existing General Medical consents...');
    
    const updateResult = await pool.query(`
      UPDATE consents 
      SET organization_id = NULL 
      WHERE consent_type = 'General Medical' 
      AND organization_id IS NOT NULL
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} existing General Medical consents`);
    
    // Step 4: Test the new system
    console.log('\n3. Testing the new consent system...');
    
    // Get a test patient
    const patientResult = await pool.query('SELECT id FROM patients LIMIT 1');
    if (patientResult.rows.length === 0) {
      console.log('   ⚠️  No patients found for testing');
    } else {
      const testPatientId = patientResult.rows[0].id;
      
      // Create a test General Medical consent with NULL organization_id
      await pool.query(`
        INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, is_active, created_by)
        VALUES ($1, NULL, 'General Medical', CURRENT_DATE, true, 1)
        ON CONFLICT (patient_id, organization_id, consent_type) 
        DO UPDATE SET 
          updated_at = CURRENT_TIMESTAMP
      `, [testPatientId]);
      
      console.log('   ✅ Created test General Medical consent with NULL organization_id');
      
      // Test the constraint
      try {
        await pool.query(`
          INSERT INTO consents (patient_id, organization_id, consent_type, consent_date, is_active, created_by)
          VALUES ($1, NULL, 'Legal', CURRENT_DATE, true, 1)
        `, [testPatientId]);
        console.log('   ❌ ERROR: Should not allow Legal consent with NULL organization_id');
      } catch (error: any) {
        if (error.message.includes('check_org_required')) {
          console.log('   ✅ Constraint working: Legal consent requires organization_id');
        } else {
          console.log('   ❌ Unexpected error:', error.message);
        }
      }
    }
    
    // Step 5: Show current consent structure
    console.log('\n4. Current consent structure:');
    const consentTypes = await pool.query(`
      SELECT 
        consent_type,
        COUNT(*) as total_count,
        COUNT(organization_id) as with_org,
        COUNT(*) - COUNT(organization_id) as without_org
      FROM consents 
      GROUP BY consent_type
      ORDER BY consent_type
    `);
    
    consentTypes.rows.forEach(row => {
      console.log(`   ${row.consent_type}:`);
      console.log(`     Total: ${row.total_count}`);
      console.log(`     With organization: ${row.with_org}`);
      console.log(`     Without organization: ${row.without_org}`);
    });
    
    console.log('\n✅ General Medical consent system implemented successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update frontend to grey out organization dropdown for General Medical');
    console.log('   2. Update compliance service to check for general consent');
    console.log('   3. Test the new workflow');
    
  } catch (error) {
    console.error('Error implementing general consent:', error);
  } finally {
    await pool.end();
  }
}

implementGeneralConsent();
