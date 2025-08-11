import axios from 'axios';
import { sendbirdConfig } from '../config/sendbird';
import pool from '../config/database';

async function checkSendbirdChannel() {
  console.log('🔍 Checking Sendbird Channel Members...\n');
  
  try {
    // Get the most recent conversation
    console.log('1. Getting most recent conversation from database:');
    console.log('==================================================');
    const convResult = await pool.query(
      `SELECT c.*, p.first_name, p.last_name
       FROM conversations c
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE c.patient_id = 1
       ORDER BY c.created_at DESC
       LIMIT 3`
    );
    
    if (convResult.rows.length === 0) {
      console.log('No conversations found for John Doe');
      return;
    }
    
    for (const conv of convResult.rows) {
      console.log(`\nConversation: "${conv.title}"`);
      console.log(`Channel URL: ${conv.sendbird_channel_url}`);
      console.log(`Created: ${conv.created_at}`);
      
      // Get members from database
      const membersResult = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, cm.is_compliant
         FROM conversation_members cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.conversation_id = $1`,
        [conv.id]
      );
      
      console.log(`\nDatabase members (${membersResult.rows.length}):`);
      membersResult.rows.forEach(member => {
        console.log(`  - ${member.first_name} ${member.last_name} (ID: ${member.id}, Compliant: ${member.is_compliant})`);
      });
      
      // Check Sendbird channel
      console.log(`\nChecking Sendbird channel...`);
      try {
        const response = await axios.get(
          `${sendbirdConfig.apiUrl}/group_channels/${conv.sendbird_channel_url}?show_member=true`,
          {
            headers: {
              'Api-Token': sendbirdConfig.apiToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const channel = response.data;
        console.log(`Channel name: ${channel.name}`);
        console.log(`Member count: ${channel.member_count}`);
        console.log(`Created at: ${new Date(channel.created_at * 1000).toISOString()}`);
        
        console.log(`\nSendbird members (${channel.members.length}):`);
        channel.members.forEach((member: any) => {
          console.log(`  - ${member.nickname} (user_id: ${member.user_id})`);
          console.log(`    Is online: ${member.is_online}`);
          console.log(`    State: ${member.state}`);
          if (member.metadata) {
            console.log(`    Metadata: ${JSON.stringify(member.metadata)}`);
          }
        });
        
        // Compare members
        console.log('\n📊 COMPARISON:');
        const dbUserIds = membersResult.rows.filter(m => m.is_compliant).map(m => `user_${m.id}`);
        const sbUserIds = channel.members.map((m: any) => m.user_id);
        
        console.log(`Expected in Sendbird: [${dbUserIds.join(', ')}]`);
        console.log(`Actually in Sendbird: [${sbUserIds.join(', ')}]`);
        
        const missing = dbUserIds.filter(id => !sbUserIds.includes(id));
        const extra = sbUserIds.filter((id: string) => !dbUserIds.includes(id));
        
        if (missing.length > 0) {
          console.log(`❌ Missing from Sendbird: [${missing.join(', ')}]`);
        }
        if (extra.length > 0) {
          console.log(`⚠️  Extra in Sendbird: [${extra.join(', ')}]`);
        }
        if (missing.length === 0 && extra.length === 0) {
          console.log('✅ Members match perfectly!');
        }
        
      } catch (error: any) {
        console.log(`❌ Error fetching Sendbird channel: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n\n2. Checking Sendbird Users:');
    console.log('============================');
    
    // Check if user_2 exists in Sendbird
    for (const userId of ['user_1', 'user_2']) {
      try {
        const response = await axios.get(
          `${sendbirdConfig.apiUrl}/users/${userId}`,
          {
            headers: {
              'Api-Token': sendbirdConfig.apiToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const user = response.data;
        console.log(`\n${userId}:`);
        console.log(`  Nickname: ${user.nickname}`);
        console.log(`  Is online: ${user.is_online}`);
        console.log(`  Is active: ${user.is_active}`);
        console.log(`  Created at: ${new Date(user.created_at * 1000).toISOString()}`);
        if (user.metadata) {
          console.log(`  Metadata: ${JSON.stringify(user.metadata)}`);
        }
      } catch (error: any) {
        console.log(`\n${userId}: ❌ Not found in Sendbird`);
      }
    }
    
    console.log('\n\n3. DIAGNOSIS:');
    console.log('=============');
    console.log('If Care TeamMember (user_2) is:');
    console.log('  - In database members but NOT in Sendbird channel → Issue with channel creation');
    console.log('  - In Sendbird channel but NOT showing in UI → Issue with UI/display');
    console.log('  - NOT in database members → Issue with compliance check during creation');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkSendbirdChannel().catch(console.error);
}

export default checkSendbirdChannel;
