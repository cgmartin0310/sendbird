import axios from 'axios';
import { sendbirdConfig } from '../config/sendbird';
import pool from '../config/database';

interface CreateChannelParams {
  name: string;
  userIds: string[];
  customType?: string;
  data?: Record<string, any>;
  coverUrl?: string;
  isDistinct?: boolean;
}

interface SendMessageParams {
  channelUrl: string;
  userId: string;
  message: string;
  customType?: string;
  data?: Record<string, any>;
}

export class SendbirdService {
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
   * Create or update a Sendbird user
   */
  async createOrUpdateUser(
    userId: string,
    nickname: string,
    profileUrl?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    try {
      // First try to create the user
      try {
        const createResponse = await axios.post(
          `${this.apiUrl}/users`,
          {
            user_id: userId,
            nickname,
            profile_url: profileUrl || '',
            metadata
          },
          { headers: this.headers }
        );
        return createResponse.data;
      } catch (createError: any) {
        // If user already exists (400 with code 400202), try to update instead
        if (createError.response?.status === 400 && createError.response?.data?.code === 400202) {
          const updateResponse = await axios.put(
            `${this.apiUrl}/users/${userId}`,
            {
              user_id: userId,
              nickname,
              profile_url: profileUrl || '',
              metadata
            },
            { headers: this.headers }
          );
          return updateResponse.data;
        }
        throw createError;
      }
    } catch (error: any) {
      console.error('Error creating/updating Sendbird user:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Create a group channel
   */
  async createGroupChannel(params: CreateChannelParams): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/group_channels`,
        {
          name: params.name,
          user_ids: params.userIds,
          custom_type: params.customType,
          data: JSON.stringify(params.data || {}),
          cover_url: params.coverUrl,
          is_distinct: params.isDistinct !== undefined ? params.isDistinct : false,  // Default to false to create unique channels
          is_public: false,
          is_super: false
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating group channel:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Add users to an existing channel
   */
  async addUsersToChannel(channelUrl: string, userIds: string[]): Promise<any> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/group_channels/${channelUrl}/invite`,
        { user_ids: userIds },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error adding users to channel:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Remove users from a channel
   */
  async removeUsersFromChannel(channelUrl: string, userIds: string[]): Promise<any> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/group_channels/${channelUrl}/leave`,
        { user_ids: userIds },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error removing users from channel:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(params: SendMessageParams): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/group_channels/${params.channelUrl}/messages`,
        {
          user_id: params.userId,
          message: params.message,
          custom_type: params.customType,
          data: JSON.stringify(params.data || {})
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannel(channelUrl: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/group_channels/${channelUrl}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting channel:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelUrl: string): Promise<void> {
    try {
      await axios.delete(
        `${this.apiUrl}/group_channels/${channelUrl}`,
        { headers: this.headers }
      );
    } catch (error: any) {
      console.error('Error deleting channel:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * List channels for a user
   */
  async listUserChannels(userId: string, limit: number = 100): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users/${userId}/my_group_channels`,
        {
          headers: this.headers,
          params: { limit, show_empty: true }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error listing user channels:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Update channel metadata
   */
  async updateChannelMetadata(
    channelUrl: string,
    data: Record<string, any>
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/group_channels/${channelUrl}`,
        { data: JSON.stringify(data) },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating channel metadata:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Create Sendbird user ID from database user ID
   */
  generateSendbirdUserId(userId: number): string {
    return `user_${userId}`;
  }

  /**
   * Sync database user with Sendbird
   */
  async syncUserWithSendbird(userId: number): Promise<string> {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, is_external, phone_number FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    const sendbirdUserId = this.generateSendbirdUserId(userId);
    const nickname = user.is_external 
      ? user.phone_number || 'External User'
      : `${user.first_name} ${user.last_name}`;

          await this.createOrUpdateUser(sendbirdUserId, nickname, '', {
        database_user_id: userId,
        is_external: user.is_external,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      });

    // Update the user's sendbird_user_id in the database
    await pool.query(
      'UPDATE users SET sendbird_user_id = $1 WHERE id = $2',
      [sendbirdUserId, userId]
    );

    return sendbirdUserId;
  }
}

export default new SendbirdService(); 