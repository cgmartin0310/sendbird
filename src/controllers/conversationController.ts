import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import sendbirdService from '../services/sendbirdService';
import complianceService from '../services/complianceService';
import smsService from '../services/smsService';

interface CreateConversationRequest {
  title: string;
  patientId: number;
  memberIds: number[];
  externalMembers?: Array<{
    phoneNumber: string;
    name?: string;
  }>;
}

export const createConversationValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('memberIds').isArray().withMessage('Member IDs must be an array'),
  body('memberIds.*').isInt().withMessage('Member IDs must be integers'),
  body('externalMembers').optional().isArray(),
  body('externalMembers.*.phoneNumber').optional().isMobilePhone('any')
];

export const createConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, patientId, memberIds, externalMembers } = req.body as CreateConversationRequest;
    const creatorUserId = req.user!.id;

    // Verify patient exists
    const patientResult = await pool.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = patientResult.rows[0];

    // Add creator to member list if not already included and remove duplicates
    const uniqueMemberIds = [...new Set(memberIds)];
    const allMemberIds = uniqueMemberIds.includes(creatorUserId) 
      ? uniqueMemberIds 
      : [...uniqueMemberIds, creatorUserId];

    // Check compliance for all internal members
    const complianceResults = await complianceService.checkMultipleUsersCompliance(
      allMemberIds,
      patientId
    );

    const compliantMembers = complianceResults.filter(r => r.isCompliant);
    const nonCompliantMembers = complianceResults.filter(r => !r.isCompliant);

    if (compliantMembers.length === 0) {
      res.status(400).json({ 
        error: 'No compliant members found',
        nonCompliantMembers 
      });
      return;
    }

    // Process external members
    const externalUsers = [];
    if (externalMembers && externalMembers.length > 0) {
      for (const external of externalMembers) {
        const externalUser = await smsService.createOrGetExternalUser(
          external.phoneNumber,
          external.name
        );
        externalUsers.push(externalUser);
      }
    }

    // Sync all users with Sendbird
    const sendbirdUserIds = [];
    
    // Sync compliant internal members
    for (const member of compliantMembers) {
      const sendbirdUserId = await sendbirdService.syncUserWithSendbird(member.userId);
      sendbirdUserIds.push(sendbirdUserId);
    }

    // Sync external users
    for (const externalUser of externalUsers) {
      const sendbirdUserId = await sendbirdService.syncUserWithSendbird(externalUser.id);
      sendbirdUserIds.push(sendbirdUserId);
    }

    // Create Sendbird channel
    const channelData = {
      patientId: patientId,
      patientName: `${patient.first_name} ${patient.last_name}`,
      createdByUserId: creatorUserId,
      conversationType: 'care_team'
    };

    const channel = await sendbirdService.createGroupChannel({
      name: title,
      userIds: sendbirdUserIds,
      customType: 'care_team_conversation',
      data: channelData
    });

    // Save conversation to database
    const conversationResult = await pool.query(
      `INSERT INTO conversations (sendbird_channel_url, patient_id, created_by_user_id, title)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [channel.channel_url, patientId, creatorUserId, title]
    );

    const conversationId = conversationResult.rows[0].id;

    // Save conversation members
    for (const member of compliantMembers) {
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id, is_compliant, compliance_notes)
         VALUES ($1, $2, $3, $4)`,
        [conversationId, member.userId, true, member.reason]
      );
    }

    // Save non-compliant members with flag
    for (const member of nonCompliantMembers) {
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id, is_compliant, compliance_notes)
         VALUES ($1, $2, $3, $4)`,
        [conversationId, member.userId, false, member.reason]
      );
    }

    // Save external members
    for (const externalUser of externalUsers) {
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id, is_compliant, compliance_notes)
         VALUES ($1, $2, $3, $4)`,
        [conversationId, externalUser.id, true, 'External user - no compliance required']
      );
    }

    // Configure channel for SMS if there are external members
    if (externalUsers.length > 0) {
      await smsService.configureChannelForSms(channel.channel_url);
    }

    res.status(201).json({
      conversationId,
      sendbirdChannelUrl: channel.channel_url,
      compliantMembers: compliantMembers.map(m => ({
        userId: m.userId,
        reason: m.reason
      })),
      nonCompliantMembers: nonCompliantMembers.map(m => ({
        userId: m.userId,
        reason: m.reason
      })),
      externalMembers: externalUsers.map(u => ({
        userId: u.id,
        phoneNumber: u.phone_number,
        name: `${u.first_name} ${u.last_name}`
      }))
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    
    // Check for Sendbird authentication errors
    if (error.response?.status === 401) {
      res.status(500).json({ 
        error: 'Sendbird API authentication failed. Please check SENDBIRD_API_TOKEN configuration.',
        details: 'Contact your administrator to configure Sendbird credentials.'
      });
      return;
    }
    
    // Check for other Sendbird errors
    if (error.response?.data) {
      res.status(500).json({ 
        error: 'Failed to create conversation',
        details: error.response.data.message || error.response.data.error || 'Sendbird API error'
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const listConversations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const result = await pool.query(
      `SELECT 
        c.id,
        c.sendbird_channel_url,
        c.title,
        c.created_at,
        c.created_by_user_id,
        c.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        cm.is_compliant,
        cm.compliance_notes
       FROM conversations c
       JOIN conversation_members cm ON c.id = cm.conversation_id
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
};

export const getConversationDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Check if user is a member
    const memberCheck = await pool.query(
      'SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get conversation details
    const conversationResult = await pool.query(
      `SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.email as creator_email
       FROM conversations c
       LEFT JOIN patients p ON c.patient_id = p.id
       LEFT JOIN users u ON c.created_by_user_id = u.id
       WHERE c.id = $1`,
      [conversationId]
    );

    if (conversationResult.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Get all members
    const membersResult = await pool.query(
      `SELECT 
        cm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.is_external,
        u.phone_number,
        o.name as organization_name
       FROM conversation_members cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE cm.conversation_id = $1`,
      [conversationId]
    );

    res.json({
      conversation: conversationResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Error getting conversation details:', error);
    res.status(500).json({ error: 'Failed to get conversation details' });
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { channelUrl, message } = req.body;
    const userId = req.user!.id;

    // Verify user has access to this channel
    const accessCheck = await pool.query(
      `SELECT cm.* 
       FROM conversation_members cm
       JOIN conversations c ON cm.conversation_id = c.id
       WHERE c.sendbird_channel_url = $1 AND cm.user_id = $2`,
      [channelUrl, userId]
    );

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get user's Sendbird ID
    const userResult = await pool.query(
      'SELECT sendbird_user_id FROM users WHERE id = $1',
      [userId]
    );

    const sendbirdUserId = userResult.rows[0].sendbird_user_id;

    // Send message through Sendbird
    const sentMessage = await sendbirdService.sendMessage({
      channelUrl,
      userId: sendbirdUserId,
      message
    });

    res.json({ message: sentMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const deleteConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get conversation details
    const convResult = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) as member_count
       FROM conversations c 
       WHERE c.id = $1`,
      [id]
    );

    if (convResult.rows.length === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversation = convResult.rows[0];

    // Check authorization: only creator or admin can delete
    if (conversation.created_by_user_id !== userId && userRole !== 'admin') {
      res.status(403).json({ error: 'Only the conversation creator or an admin can delete this conversation' });
      return;
    }

    // Delete from Sendbird first
    try {
      await sendbirdService.deleteChannel(conversation.sendbird_channel_url);
    } catch (sendbirdError: any) {
      console.error('Error deleting Sendbird channel:', sendbirdError);
      // Continue with database deletion even if Sendbird fails
    }

    // Delete conversation members first (due to foreign key constraint)
    await pool.query('DELETE FROM conversation_members WHERE conversation_id = $1', [id]);

    // Delete the conversation
    await pool.query('DELETE FROM conversations WHERE id = $1', [id]);

    res.json({ 
      success: true, 
      message: 'Conversation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
}; 