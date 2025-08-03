import pool from '../config/database';
import { SendbirdService } from '../services/sendbirdService';

async function syncAllUsers() {
  console.log('Starting Sendbird user sync...');
  
  const sendbirdService = new SendbirdService();
  
  try {
    // Get all non-external users
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, organization_id 
       FROM users 
       WHERE is_external = false OR is_external IS NULL
       ORDER BY id`
    );
    
    console.log(`Found ${result.rows.length} users to sync`);
    
    for (const user of result.rows) {
      try {
        const sendbirdUserId = `user_${user.id}`;
        const nickname = `${user.first_name} ${user.last_name}`.trim() || user.email;
        
        console.log(`Syncing user ${user.id}: ${nickname} (${sendbirdUserId})`);
        
        await sendbirdService.createOrUpdateUser(
          sendbirdUserId,
          nickname,
          undefined,
          {
            database_user_id: user.id,
            email: user.email,
            role: user.role,
            organization_id: user.organization_id
          }
        );
        
        console.log(`✓ Successfully synced user ${user.id}`);
      } catch (error: any) {
        console.error(`✗ Failed to sync user ${user.id}:`, error.response?.data || error.message);
      }
    }
    
    console.log('\nSync complete!');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    await pool.end();
  }
}

syncAllUsers().catch(console.error);