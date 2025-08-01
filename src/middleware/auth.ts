import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    organizationId: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as any;

    const result = await pool.query(
      'SELECT id, email, role, organization_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      organizationId: result.rows[0].organization_id
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}; 