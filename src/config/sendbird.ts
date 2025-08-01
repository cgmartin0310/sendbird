import SendBird from 'sendbird';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SENDBIRD_APP_ID) {
  throw new Error('SENDBIRD_APP_ID is required');
}

// Initialize Sendbird SDK
const sb = new SendBird({ appId: process.env.SENDBIRD_APP_ID });

export const sendbirdConfig = {
  appId: process.env.SENDBIRD_APP_ID,
  apiToken: process.env.SENDBIRD_API_TOKEN || '',
  apiUrl: `https://api-${process.env.SENDBIRD_APP_ID}.sendbird.com/v3`
};

export default sb; 