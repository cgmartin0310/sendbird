import axios from 'axios';
import { sendbirdConfig } from '../config/sendbird';

async function testChannelCreation() {
  console.log('🧪 Testing Sendbird Channel Creation Behavior...\n');
  
  const headers = {
    'Api-Token': sendbirdConfig.apiToken,
    'Content-Type': 'application/json'
  };
  
  const testUserIds = ['user_1', 'user_2'];
  const timestamp = Date.now();
  
  try {
    // Test 1: Create channel with is_distinct: true
    console.log('Test 1: Creating channel with is_distinct: true');
    console.log('Members:', testUserIds);
    
    const response1 = await axios.post(
      `${sendbirdConfig.apiUrl}/group_channels`,
      {
        name: `Test Channel DISTINCT TRUE - ${timestamp}`,
        user_ids: testUserIds,
        custom_type: 'test_distinct_true',
        is_distinct: true,
        is_public: false,
        is_super: false
      },
      { headers }
    );
    
    console.log('✅ Created channel 1:');
    console.log('  URL:', response1.data.channel_url);
    console.log('  Name:', response1.data.name);
    
    // Test 2: Create another channel with same users, is_distinct: true
    console.log('\nTest 2: Creating ANOTHER channel with SAME users, is_distinct: true');
    
    const response2 = await axios.post(
      `${sendbirdConfig.apiUrl}/group_channels`,
      {
        name: `Test Channel DISTINCT TRUE SECOND - ${timestamp}`,
        user_ids: testUserIds,
        custom_type: 'test_distinct_true_2',
        is_distinct: true,
        is_public: false,
        is_super: false
      },
      { headers }
    );
    
    console.log('✅ Created channel 2:');
    console.log('  URL:', response2.data.channel_url);
    console.log('  Name:', response2.data.name);
    
    if (response1.data.channel_url === response2.data.channel_url) {
      console.log('⚠️  SAME CHANNEL RETURNED! is_distinct: true causes deduplication!');
    } else {
      console.log('✅ Different channels created');
    }
    
    // Test 3: Create channel with is_distinct: false
    console.log('\nTest 3: Creating channel with is_distinct: false');
    
    const response3 = await axios.post(
      `${sendbirdConfig.apiUrl}/group_channels`,
      {
        name: `Test Channel DISTINCT FALSE - ${timestamp}`,
        user_ids: testUserIds,
        custom_type: 'test_distinct_false',
        is_distinct: false,
        is_public: false,
        is_super: false
      },
      { headers }
    );
    
    console.log('✅ Created channel 3:');
    console.log('  URL:', response3.data.channel_url);
    console.log('  Name:', response3.data.name);
    
    // Test 4: Create another channel with same users, is_distinct: false
    console.log('\nTest 4: Creating ANOTHER channel with SAME users, is_distinct: false');
    
    const response4 = await axios.post(
      `${sendbirdConfig.apiUrl}/group_channels`,
      {
        name: `Test Channel DISTINCT FALSE SECOND - ${timestamp}`,
        user_ids: testUserIds,
        custom_type: 'test_distinct_false_2',
        is_distinct: false,
        is_public: false,
        is_super: false
      },
      { headers }
    );
    
    console.log('✅ Created channel 4:');
    console.log('  URL:', response4.data.channel_url);
    console.log('  Name:', response4.data.name);
    
    if (response3.data.channel_url === response4.data.channel_url) {
      console.log('⚠️  SAME CHANNEL RETURNED! is_distinct: false still causes deduplication!');
    } else {
      console.log('✅ Different channels created with is_distinct: false');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log('is_distinct: true behavior:');
    console.log('  Channel 1 URL:', response1.data.channel_url);
    console.log('  Channel 2 URL:', response2.data.channel_url);
    console.log('  Result:', response1.data.channel_url === response2.data.channel_url ? 'DEDUPLICATED (same channel)' : 'UNIQUE channels');
    
    console.log('\nis_distinct: false behavior:');
    console.log('  Channel 3 URL:', response3.data.channel_url);
    console.log('  Channel 4 URL:', response4.data.channel_url);
    console.log('  Result:', response3.data.channel_url === response4.data.channel_url ? 'DEDUPLICATED (same channel)' : 'UNIQUE channels');
    
    console.log('\n🎯 RECOMMENDATION:');
    if (response1.data.channel_url === response2.data.channel_url && response3.data.channel_url !== response4.data.channel_url) {
      console.log('Use is_distinct: false to create unique channels for each conversation');
    } else if (response1.data.channel_url !== response2.data.channel_url && response3.data.channel_url === response4.data.channel_url) {
      console.log('Use is_distinct: true to create unique channels for each conversation');
    } else {
      console.log('Both settings behave the same - may need to use unique user combinations or other methods');
    }
    
    // Clean up test channels
    console.log('\n🧹 Cleaning up test channels...');
    for (const channel of [response1.data, response2.data, response3.data, response4.data]) {
      if (channel.name.includes('Test Channel')) {
        try {
          await axios.delete(
            `${sendbirdConfig.apiUrl}/group_channels/${channel.channel_url}`,
            { headers }
          );
          console.log(`  Deleted: ${channel.name}`);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testChannelCreation().catch(console.error);
}

export default testChannelCreation;
