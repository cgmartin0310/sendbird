import pool from '../config/database';
import sendbirdService from './sendbirdService';
import axios from 'axios';
import { sendbirdConfig } from '../config/sendbird';

export class SmsService {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiUrl = sendbirdConfig.apiUrl;
    this.headers = {
      'Api-Token': sendbirdConfig.apiToken,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create SMS user in Sendbird
   * SMS users in Sendbird are special users that can receive messages via SMS
   */
  async createSmsUser(phoneNumber: string, nickname: string): Promise<any> {
    try {
      const userId = `sms_${phoneNumber.replace(/[^0-9]/g, '')}`;
      
      const response = await axios.put(
        `${this.apiUrl}/users/${userId}`,
        {
          user_id: userId,
          nickname: nickname,
          phone_number: phoneNumber,
          is_active: true,
          // Mark this as an SMS user
          metadata: {
            user_type: 'sms',
            phone_number: phoneNumber
          }
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating SMS user in Sendbird:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Create or get external user by phone number
   */
  async createOrGetExternalUser(phoneNumber: string, name?: string): Promise<any> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1 AND is_external = true',
      [phoneNumber]
    );

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0];
    }

    // Create new external user
    const [firstName, lastName] = name ? name.split(' ') : ['External', 'User'];
    const result = await pool.query(
      `INSERT INTO users (
        email, 
        password, 
        first_name, 
        last_name, 
        role, 
        phone_number, 
        is_external
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        `${phoneNumber}@external.sms`, // Placeholder email
        'external-user-no-login', // External users can't log in
        firstName,
        lastName,
        'external',
        phoneNumber,
        true
      ]
    );

    const user = result.rows[0];

    // Create SMS user in Sendbird
    const sendbirdUserId = `sms_${phoneNumber.replace(/[^0-9]/g, '')}`;
    await this.createSmsUser(phoneNumber, `${firstName} ${lastName}`);

    // Update user with Sendbird ID
    await pool.query(
      'UPDATE users SET sendbird_user_id = $1 WHERE id = $2',
      [sendbirdUserId, user.id]
    );

    user.sendbird_user_id = sendbirdUserId;
    return user;
  }

  /**
   * Send SMS message through Sendbird
   * When messages are sent to SMS users in Sendbird channels, 
   * Sendbird automatically sends them as SMS
   */
  async sendNotificationSms(phoneNumber: string, message: string): Promise<void> {
    try {
      // In Sendbird, SMS is sent automatically when you send a message 
      // to an SMS user in a channel. This method is for standalone SMS notifications.
      
      // Create a system notification channel if needed
      const systemUserId = 'system_notifications';
      const smsUserId = `sms_${phoneNumber.replace(/[^0-9]/g, '')}`;
      
      // Create a temporary channel for notification
      const channel = await sendbirdService.createGroupChannel({
        name: 'SMS Notification',
        userIds: [systemUserId, smsUserId],
        customType: 'sms_notification',
        isDistinct: true
      });

      // Send the message (Sendbird will deliver it as SMS)
      await sendbirdService.sendMessage({
        channelUrl: channel.channel_url,
        userId: systemUserId,
        message: message
      });

      console.log(`SMS notification sent to ${phoneNumber}`);
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  /**
   * Format message for SMS with conversation context
   */
  formatSmsMessage(
    conversationTitle: string,
    senderName: string,
    message: string
  ): string {
    return `[${conversationTitle}] ${senderName}: ${message}`;
  }

  /**
   * Check if a phone number is registered as an SMS user in Sendbird
   */
  async isSmsUserRegistered(phoneNumber: string): Promise<boolean> {
    try {
      const userId = `sms_${phoneNumber.replace(/[^0-9]/g, '')}`;
      const response = await axios.get(
        `${this.apiUrl}/users/${userId}`,
        { headers: this.headers }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Configure SMS settings for a channel
   * This ensures SMS users in the channel receive messages as SMS
   */
  async configureChannelForSms(channelUrl: string): Promise<void> {
    try {
      await axios.put(
        `${this.apiUrl}/group_channels/${channelUrl}`,
        {
          // Enable SMS delivery for this channel
          custom_type: 'care_team_conversation',
          data: JSON.stringify({
            sms_enabled: true,
            sms_fallback: true
          })
        },
        { headers: this.headers }
      );
    } catch (error: any) {
      console.error('Error configuring channel for SMS:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Process incoming SMS webhook from Sendbird
   * Sendbird can forward incoming SMS replies to your webhook
   */
  async processIncomingSms(data: any): Promise<void> {
    // Sendbird webhook data structure for incoming SMS
    const { user_id, channel_url, message } = data;
    
    console.log('Processing incoming SMS from Sendbird:', {
      user_id,
      channel_url,
      message
    });

    // The message is already in the Sendbird channel,
    // so we just need to log it or perform any additional processing
  }
}

export default new SmsService(); 