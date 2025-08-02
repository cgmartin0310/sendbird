import dotenv from 'dotenv';
import { sendbirdConfig } from '../config/sendbird';
import axios from 'axios';

dotenv.config();

async function testSendbirdConnection() {
  console.log('Testing Sendbird Configuration...\n');
  
  // Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   SENDBIRD_APP_ID: ${process.env.SENDBIRD_APP_ID ? '✓ Set' : '✗ NOT SET'}`);
  console.log(`   SENDBIRD_API_TOKEN: ${process.env.SENDBIRD_API_TOKEN ? '✓ Set' : '✗ NOT SET'}`);
  
  if (!process.env.SENDBIRD_APP_ID || !process.env.SENDBIRD_API_TOKEN) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please set SENDBIRD_APP_ID and SENDBIRD_API_TOKEN in your .env file');
    process.exit(1);
  }
  
  // Test API connection
  console.log('\n2. Testing API Connection:');
  try {
    const response = await axios.get(
      `${sendbirdConfig.apiUrl}/users?limit=1`,
      {
        headers: {
          'Api-Token': sendbirdConfig.apiToken
        }
      }
    );
    
    console.log('   ✓ Successfully connected to Sendbird API');
    console.log(`   Total users: ${response.data.total_user_count || 0}`);
    
  } catch (error: any) {
    console.log('   ✗ Failed to connect to Sendbird API');
    
    if (error.response?.status === 401) {
      console.log('   Error: Invalid API token (401 Unauthorized)');
    } else if (error.response?.status === 400) {
      console.log('   Error: Invalid App ID (400 Bad Request)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
  
  console.log('\n✅ Sendbird configuration is valid!');
}

testSendbirdConnection().catch(console.error);