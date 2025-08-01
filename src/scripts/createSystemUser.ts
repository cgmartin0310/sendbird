import dotenv from 'dotenv';
import axios from 'axios';
import { sendbirdConfig } from '../config/sendbird';

dotenv.config();

async function createSystemUser() {
  const userId = 'system_notifications';
  const nickname = 'System Notifications';
  
  try {
    const response = await axios.put(
      `${sendbirdConfig.apiUrl}/users/${userId}`,
      {
        user_id: userId,
        nickname: nickname,
        profile_url: '',
        is_active: true,
        metadata: {
          user_type: 'system',
          description: 'System user for sending notifications'
        }
      },
      {
        headers: {
          'Api-Token': sendbirdConfig.apiToken,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('System user created successfully:', response.data);
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error === 'User already exists.') {
      console.log('System user already exists');
    } else {
      console.error('Error creating system user:', error.response?.data || error.message);
      process.exit(1);
    }
  }
}

createSystemUser(); 