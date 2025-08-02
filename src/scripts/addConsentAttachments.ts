import pool from '../config/database';

async function addConsentAttachments() {
  console.log('Adding consent attachment support...');
  
  try {
    // Create consent_attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consent_attachments (
        id SERIAL PRIMARY KEY,
        consent_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        storage_path TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consent_id) REFERENCES consents(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    
    console.log('✓ Created consent_attachments table');
    
    // Add index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_consent_attachments_consent_id 
      ON consent_attachments(consent_id)
    `);
    
    console.log('✓ Created indexes');
    
    // Add organization_id to consents table for organization-specific consents
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents ADD COLUMN specific_organization_id INTEGER;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE consents 
          ADD CONSTRAINT fk_consents_specific_organization 
          FOREIGN KEY (specific_organization_id) 
          REFERENCES organizations(id) ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END;
      END $$;
    `);
    
    console.log('✓ Added specific_organization_id to consents table');
    
    // Add consent_type to track which compliance group this consent is for
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE consents ADD COLUMN consent_type VARCHAR(100);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);
    
    console.log('✓ Added consent_type to consents table');
    
    console.log('\nConsent attachment support added successfully!');
  } catch (error) {
    console.error('Error adding consent attachment support:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addConsentAttachments().catch(console.error);