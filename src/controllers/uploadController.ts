import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'consents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

export const uploadConsentAttachment = [
  upload.single('attachment'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { consentId } = req.body;
      const userId = req.user!.id;

      if (!consentId) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Consent ID is required' });
        return;
      }

      // Verify the consent exists and user has permission
      const consentCheck = await pool.query(
        `SELECT c.*, o.name as organization_name 
         FROM consents c
         JOIN organizations o ON c.organization_id = o.id
         WHERE c.id = $1`,
        [consentId]
      );

      if (consentCheck.rows.length === 0) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Consent not found' });
        return;
      }

      // Store attachment record in database
      const result = await pool.query(
        `INSERT INTO consent_attachments 
         (consent_id, filename, original_filename, mime_type, file_size, storage_path, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          consentId,
          req.file.filename,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          req.file.path,
          userId
        ]
      );

      res.status(201).json({ 
        attachment: result.rows[0],
        message: 'File uploaded successfully' 
      });
    } catch (error: any) {
      console.error('Error uploading consent attachment:', error);
      
      // Clean up file if it was uploaded
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({ error: error.message || 'Failed to upload attachment' });
    }
  }
];

export const getConsentAttachments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const consentId = parseInt(req.params.consentId);

    const result = await pool.query(
      `SELECT ca.*, u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM consent_attachments ca
       JOIN users u ON ca.uploaded_by = u.id
       WHERE ca.consent_id = $1
       ORDER BY ca.created_at DESC`,
      [consentId]
    );

    res.json({ attachments: result.rows });
  } catch (error) {
    console.error('Error fetching consent attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

export const downloadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachmentId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT * FROM consent_attachments WHERE id = $1`,
      [attachmentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    const attachment = result.rows[0];
    const filePath = attachment.storage_path;

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on server' });
      return;
    }

    res.download(filePath, attachment.original_filename);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};