import pool from '../config/database';

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        organization_id INTEGER,
        phone_number VARCHAR(20),
        is_external BOOLEAN DEFAULT false,
        sendbird_user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create organizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        compliance_group_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create compliance groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compliance_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        medical_record_number VARCHAR(100),
        risk_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create consents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consents (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        consent_type VARCHAR(100) NOT NULL,
        consent_date DATE NOT NULL,
        expiry_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(patient_id, organization_id, consent_type)
      )
    `);

    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        sendbird_channel_url VARCHAR(255) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id),
        created_by_user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create conversation_members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        is_compliant BOOLEAN DEFAULT true,
        compliance_notes TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(conversation_id, user_id)
      )
    `);

    // Create care_teams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS care_teams (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create care_team_members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS care_team_members (
        id SERIAL PRIMARY KEY,
        care_team_id INTEGER NOT NULL REFERENCES care_teams(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(care_team_id, user_id)
      )
    `);

    // Add foreign key constraints
    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_organization 
      FOREIGN KEY (organization_id) 
      REFERENCES organizations(id) 
      ON DELETE SET NULL
    `);

    await pool.query(`
      ALTER TABLE organizations 
      ADD CONSTRAINT fk_organizations_compliance_group 
      FOREIGN KEY (compliance_group_id) 
      REFERENCES compliance_groups(id) 
      ON DELETE SET NULL
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_organizations_compliance_group ON organizations(compliance_group_id);
      CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consents_organization ON consents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_patient ON conversations(patient_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_care_team_members_user ON care_team_members(user_id);
    `);

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate(); 