import pool from '../config/database';

async function fixCareTeamConsent() {
  console.log('🔧 Checking and fixing Care Team Member consent...\n');
  
  try {
    // 1. Check Care TeamMember details
    console.log('1. Checking Care TeamMember (user ID 2)...');
    const userResult = await pool.query(
      `SELECT u.*, o.name as org_name 
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = 2`
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User ID 2 not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization: ${user.org_name} (ID: ${user.organization_id})`);
    
    if (!user.organization_id) {
      console.log('❌ User has no organization! Cannot create consent.');
      return;
    }
    
    // 2. Check if Sendbird user exists
    console.log('\n2. Checking Sendbird user...');
    const sendbirdUserId = `user_${user.id}`;
    console.log(`   Sendbird User ID: ${sendbirdUserId}`);
    
    // 3. Check patient John Doe
    console.log('\n3. Checking patient John Doe...');
    const patientResult = await pool.query(
      `SELECT * FROM patients WHERE id = 1`
    );
    
    if (patientResult.rows.length === 0) {
      console.log('❌ Patient John Doe (ID 1) not found!');
      return;
    }
    
    const patient = patientResult.rows[0];
    console.log(`✅ Found: ${patient.first_name} ${patient.last_name}`);
    
    // 4. Check existing consent
    console.log('\n4. Checking existing consent...');
    const consentCheck = await pool.query(
      `SELECT * FROM consents 
       WHERE patient_id = $1 
         AND organization_id = $2 
         AND is_active = true`,
      [patient.id, user.organization_id]
    );
    
    if (consentCheck.rows.length > 0) {
      console.log('✅ Consent already exists and is active!');
      const consent = consentCheck.rows[0];
      console.log(`   Consent Type: ${consent.consent_type}`);
      console.log(`   Created: ${consent.created_at}`);
    } else {
      console.log('⚠️ No active consent found. Creating one...');
      
      // Create consent
      const createResult = await pool.query(
        `INSERT INTO consents (
          patient_id, 
          organization_id, 
          consent_type, 
          consent_date, 
          is_active,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT (patient_id, organization_id, consent_type) 
        DO UPDATE SET 
          is_active = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          patient.id,
          user.organization_id,
          'HIPAA Authorization',
          new Date().toISOString().split('T')[0],
          true,
          1 // Admin user
        ]
      );
      
      console.log('✅ Consent created successfully!');
      console.log(`   Consent ID: ${createResult.rows[0].id}`);
    }
    
    // 5. Check recent conversations
    console.log('\n5. Checking recent conversations...');
    const conversationsResult = await pool.query(
      `SELECT c.*, cm.is_compliant, cm.compliance_notes
       FROM conversations c
       LEFT JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = 2
       WHERE c.patient_id = 1
       ORDER BY c.created_at DESC
       LIMIT 3`
    );
    
    console.log(`Found ${conversationsResult.rows.length} recent conversations:`);
    conversationsResult.rows.forEach(conv => {
      console.log(`   - "${conv.title}"`);
      console.log(`     Channel: ${conv.sendbird_channel_url}`);
      console.log(`     Member status: ${conv.is_compliant === null ? 'Not a member' : (conv.is_compliant ? 'Compliant' : 'Non-compliant')}`);
      if (conv.compliance_notes) {
        console.log(`     Notes: ${conv.compliance_notes}`);
      }
    });
    
    // 6. Check Sendbird sync
    console.log('\n6. Ensuring Sendbird sync...');
    console.log('   Run this command to sync: npm run sync:sendbird-users');
    
    console.log('\n✅ Care Team Member should now be able to join conversations!');
    console.log('\n📝 Next steps:');
    console.log('1. The Care Team Member now has consent for John Doe');
    console.log('2. Try creating a new conversation');
    console.log('3. Care Team Member should appear in the chat');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixCareTeamConsent().catch(console.error);
}

export default fixCareTeamConsent;
