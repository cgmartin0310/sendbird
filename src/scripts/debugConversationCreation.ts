import pool from '../config/database';
import * as sendbirdService from '../services/sendbirdService';
import * as complianceService from '../services/complianceService';

async function debugConversationCreation() {
  console.log('🔍 Debugging Conversation Creation Process...\n');
  
  try {
    const patientId = 1;
    const memberIds = [1, 2]; // Test User and Care TeamMember
    
    console.log('Input:');
    console.log('======');
    console.log(`Patient ID: ${patientId}`);
    console.log(`Member IDs: [${memberIds.join(', ')}]`);
    
    // 1. Check each member
    console.log('\n1. Member Details:');
    console.log('==================');
    for (const userId of memberIds) {
      const userResult = await pool.query(
        `SELECT u.*, o.name as org_name 
         FROM users u 
         LEFT JOIN organizations o ON u.organization_id = o.id 
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log(`\nUser ID ${userId}:`);
        console.log(`  Name: ${user.first_name} ${user.last_name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Org: ${user.org_name} (ID: ${user.organization_id})`);
      }
    }
    
    // 2. Check compliance for each member
    console.log('\n2. Compliance Check:');
    console.log('====================');
    const complianceResults = await complianceService.checkMultipleUsersCompliance(
      memberIds,
      patientId
    );
    
    console.log('Compliance Results:');
    complianceResults.forEach(result => {
      console.log(`\nUser ID ${result.userId}:`);
      console.log(`  Compliant: ${result.isCompliant ? '✅' : '❌'}`);
      console.log(`  Reason: ${result.reason}`);
    });
    
    const compliantMembers = complianceResults.filter(r => r.isCompliant);
    const nonCompliantMembers = complianceResults.filter(r => !r.isCompliant);
    
    console.log(`\nSummary:`);
    console.log(`  Compliant members: [${compliantMembers.map(m => m.userId).join(', ')}]`);
    console.log(`  Non-compliant members: [${nonCompliantMembers.map(m => m.userId).join(', ')}]`);
    
    // 3. Check Sendbird users
    console.log('\n3. Sendbird User Check:');
    console.log('========================');
    for (const member of compliantMembers) {
      const sendbirdUserId = `user_${member.userId}`;
      console.log(`\nChecking Sendbird user: ${sendbirdUserId}`);
      
      try {
        // Get user details from database
        const userResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [member.userId]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          console.log(`  Database user: ${user.first_name} ${user.last_name}`);
          
          // Try to sync with Sendbird
          console.log(`  Attempting to sync with Sendbird...`);
          const syncedUserId = await sendbirdService.syncUserWithSendbird(member.userId);
          console.log(`  ✅ Synced as: ${syncedUserId}`);
        }
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    // 4. Manual consent check
    console.log('\n4. Manual Consent Check:');
    console.log('=========================');
    for (const userId of memberIds) {
      const consentResult = await pool.query(
        `SELECT c.*, o.name as org_name
         FROM consents c
         JOIN organizations o ON c.organization_id = o.id
         WHERE c.patient_id = $1 
           AND c.organization_id = (SELECT organization_id FROM users WHERE id = $2)
           AND c.is_active = true
           AND (c.expiry_date IS NULL OR c.expiry_date > CURRENT_DATE)`,
        [patientId, userId]
      );
      
      console.log(`\nUser ID ${userId}:`);
      if (consentResult.rows.length > 0) {
        const consent = consentResult.rows[0];
        console.log(`  ✅ Has consent`);
        console.log(`     Organization: ${consent.org_name}`);
        console.log(`     Type: ${consent.consent_type}`);
        console.log(`     Date: ${consent.consent_date}`);
      } else {
        console.log(`  ❌ No consent found`);
        
        // Check what org they're in
        const userOrgResult = await pool.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [userId]
        );
        
        if (userOrgResult.rows.length > 0 && userOrgResult.rows[0].organization_id) {
          const orgId = userOrgResult.rows[0].organization_id;
          
          // Check if ANY consent exists for this patient from this org
          const anyConsentResult = await pool.query(
            `SELECT * FROM consents 
             WHERE patient_id = $1 AND organization_id = $2`,
            [patientId, orgId]
          );
          
          if (anyConsentResult.rows.length > 0) {
            console.log(`     Found inactive/expired consent:`);
            anyConsentResult.rows.forEach(c => {
              console.log(`       - Active: ${c.is_active}, Expiry: ${c.expiry_date}`);
            });
          } else {
            console.log(`     No consent at all for org ID ${orgId}`);
          }
        }
      }
    }
    
    // 5. Test the actual compliance service
    console.log('\n5. Testing Compliance Service Directly:');
    console.log('=========================================');
    for (const userId of memberIds) {
      const isCompliant = await complianceService.checkUserCompliance(userId, patientId);
      console.log(`User ID ${userId}: ${isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    }
    
    console.log('\n6. ANALYSIS:');
    console.log('=============');
    if (compliantMembers.length < memberIds.length) {
      console.log('❌ Some members are being filtered out during compliance check.');
      console.log('   This explains why they don\'t appear in conversations.');
      console.log('\n   Next steps:');
      console.log('   1. Check the compliance service logic');
      console.log('   2. Verify consent dates and expiry');
      console.log('   3. Check organization assignments');
    } else {
      console.log('✅ All members pass compliance check.');
      console.log('   The issue might be with Sendbird sync or channel creation.');
      console.log('\n   Next steps:');
      console.log('   1. Check Sendbird user creation');
      console.log('   2. Verify channel member addition');
      console.log('   3. Check for errors in Sendbird API calls');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  debugConversationCreation().catch(console.error);
}

export default debugConversationCreation;
