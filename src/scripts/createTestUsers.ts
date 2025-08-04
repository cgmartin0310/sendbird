import pool from '../config/database';
import bcrypt from 'bcryptjs';
import SendbirdService from '../services/sendbirdService';

const testUsers = [
  {
    email: 'care.team1@healthcare.com',
    password: 'TestPass123!',
    firstName: 'Care',
    lastName: 'Team One',
    role: 'care_team_member',
    organizationId: 1
  },
  {
    email: 'care.team2@healthcare.com', 
    password: 'TestPass123!',
    firstName: 'Care',
    lastName: 'Team Two',
    role: 'care_team_member',
    organizationId: 1
  },
  {
    email: 'admin2@healthcare.com',
    password: 'TestPass123!',
    firstName: 'Admin',
    lastName: 'Two',
    role: 'admin',
    organizationId: 1
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      // Insert user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role
         RETURNING id, email, first_name, last_name, role`,
        [user.email, passwordHash, user.firstName, user.lastName, user.role, user.organizationId]
      );
      
      const createdUser = result.rows[0];
      console.log(`✓ Created/Updated user: ${createdUser.email} (${createdUser.role})`);
      
      // Sync with Sendbird
      try {
        const sendbirdUserId = `user_${createdUser.id}`;
        const nickname = `${createdUser.first_name} ${createdUser.last_name}`;
        
        await SendbirdService.createOrUpdateUser(
          sendbirdUserId,
          nickname,
          '', // profile_url
          {
            database_user_id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role
          }
        );
        console.log(`  ✓ Synced with Sendbird as ${sendbirdUserId}`);
      } catch (sbError: any) {
        console.error(`  ✗ Failed to sync with Sendbird:`, sbError.response?.data || sbError.message);
      }
      
    } catch (error) {
      console.error(`✗ Failed to create user ${user.email}:`, error);
    }
  }
  
  console.log('\nTest users created successfully!');
  console.log('All users have password: TestPass123!');
}

if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}