import pool from '../config/database';

interface ComplianceGroupData {
  name: string;
  description: string;
  requires_consent: boolean;
  requires_organization_consent: boolean;
}

const complianceGroups: ComplianceGroupData[] = [
  {
    name: 'General Medical',
    description: 'Standard HIPAA compliance for general medical records. Requires patient consent.',
    requires_consent: true,
    requires_organization_consent: false
  },
  {
    name: 'Interagency',
    description: 'For government and interagency communications. No patient consent required.',
    requires_consent: false,
    requires_organization_consent: false
  },
  {
    name: 'Legal',
    description: 'For legal and court-ordered disclosures. Requires individual consent per organization.',
    requires_consent: true,
    requires_organization_consent: true
  },
  {
    name: 'Other',
    description: 'For special circumstances. Requires individual consent per organization.',
    requires_consent: true,
    requires_organization_consent: true
  },
  {
    name: 'SUD Notes',
    description: 'Substance Use Disorder records (42 CFR Part 2). Requires individual consent per organization.',
    requires_consent: true,
    requires_organization_consent: true
  }
];

async function setupComplianceGroups() {
  console.log('Setting up compliance groups...');
  
  try {
    // First, add the new columns to compliance_groups table if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE compliance_groups ADD COLUMN requires_consent BOOLEAN DEFAULT true;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE compliance_groups ADD COLUMN requires_organization_consent BOOLEAN DEFAULT false;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);
    
    console.log('Updated compliance_groups table schema');
    
    // Insert or update compliance groups
    for (const group of complianceGroups) {
      const result = await pool.query(
        `INSERT INTO compliance_groups (name, description, requires_consent, requires_organization_consent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE
         SET description = EXCLUDED.description,
             requires_consent = EXCLUDED.requires_consent,
             requires_organization_consent = EXCLUDED.requires_organization_consent,
             updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [group.name, group.description, group.requires_consent, group.requires_organization_consent]
      );
      
      console.log(`✓ Created/Updated compliance group: ${result.rows[0].name}`);
    }
    
    // Display all compliance groups
    const allGroups = await pool.query('SELECT * FROM compliance_groups ORDER BY name');
    console.log('\nAll compliance groups:');
    allGroups.rows.forEach(group => {
      console.log(`- ${group.name}: ${group.description}`);
      console.log(`  Requires consent: ${group.requires_consent}, Per organization: ${group.requires_organization_consent}`);
    });
    
    console.log('\nCompliance groups setup complete!');
  } catch (error) {
    console.error('Error setting up compliance groups:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupComplianceGroups().catch(console.error);