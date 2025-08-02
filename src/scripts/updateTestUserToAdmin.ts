import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

async function updateTestUserToAdmin() {
  console.log('Updating test user to admin role...\n');
  
  try {
    // Update test user's role to admin
    const result = await pool.query(
      `UPDATE users 
       SET role = 'admin' 
       WHERE email = 'test.user@healthcare.com'
       RETURNING id, email, first_name, last_name, role`,
      []
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Successfully updated user:');
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('\nYou can now access the admin panel!');
    } else {
      console.log('❌ User not found: test.user@healthcare.com');
      console.log('   Make sure the user exists first.');
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await pool.end();
  }
}

updateTestUserToAdmin().catch(console.error);