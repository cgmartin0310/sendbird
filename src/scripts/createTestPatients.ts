import pool from '../config/database';

const testPatients = [
  {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-05-15',
    gender: 'Male',
    address: '123 Main St, Anytown, USA',
    phoneNumber: '+1234567890',
    email: 'john.doe@example.com'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-08-22',
    gender: 'Female',
    address: '456 Oak Ave, Somewhere, USA',
    phoneNumber: '+1234567891',
    email: 'jane.smith@example.com'
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    dateOfBirth: '1990-03-10',
    gender: 'Male',
    address: '789 Pine Rd, Elsewhere, USA',
    phoneNumber: '+1234567892',
    email: 'robert.johnson@example.com'
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: '1985-12-02',
    gender: 'Female',
    address: '321 Elm St, Anywhere, USA',
    phoneNumber: '+1234567893',
    email: 'maria.garcia@example.com'
  }
];

async function createTestPatients() {
  console.log('Creating test patients...\n');
  
  try {
    for (const patient of testPatients) {
      const result = await pool.query(
        `INSERT INTO patients (
          first_name, last_name, date_of_birth, gender, 
          address, phone_number, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        RETURNING id, first_name, last_name`,
        [
          patient.firstName, 
          patient.lastName, 
          patient.dateOfBirth, 
          patient.gender,
          patient.address, 
          patient.phoneNumber, 
          patient.email
        ]
      );
      
      console.log(`✓ Created patient: ${result.rows[0].first_name} ${result.rows[0].last_name} (ID: ${result.rows[0].id})`);
    }
    
    console.log('\n✅ Test patients created successfully!');
    console.log('\nYou can now:');
    console.log('1. Create consents through the Admin UI');
    console.log('2. Run "npm run create:consent" to auto-create consents for all care team members');
    
  } catch (error) {
    console.error('Error creating test patients:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createTestPatients().catch(console.error);
}