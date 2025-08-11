import pool from '../config/database';

async function addCreatedByToConsents() {
  console.log('Adding created_by column to consents table...');
  
  try {
    // Add created_by column to consents table
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents ADD COLUMN created_by INTEGER;
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'Column created_by already exists';
        END;
        
        BEGIN
          ALTER TABLE consents 
          ADD CONSTRAINT fk_consents_created_by 
          FOREIGN KEY (created_by) 
          REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN 
            RAISE NOTICE 'Foreign key constraint already exists';
        END;
      END $$;
    `);
    
    console.log('✓ Added created_by column to consents table');
    
    // Create index for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_consents_created_by 
      ON consents(created_by)
    `);
    
    console.log('✓ Created index on created_by column');
    
    // Check the current schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'consents'
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent consents table schema:');
    console.log('=============================');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('Error adding created_by column:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addCreatedByToConsents().catch(console.error);
}

export default addCreatedByToConsents;
