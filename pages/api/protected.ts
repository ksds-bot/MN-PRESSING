/**
 * Protected API endpoint example
 * GET /api/protected
 * POST /api/protected
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth, DecodedToken } from '@/lib/middleware/auth';

export interface ProtectedResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  user?: Partial<DecodedToken>;
  timestamp?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProtectedResponse>
) {
  const auth = verifyAuth(req);

  if (!auth.valid || !auth.user) {
    return res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized',
    });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Access granted to protected resource',
        data: {
          secretData: 'This is sensitive information',
          timestamp: new Date().toISOString(),
        },
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        },
      });
    }

    if (req.method === 'POST') {
      const { data: bodyData } = req.body;

      return res.status(200).json({
        success: true,
        message: 'Data received and processed',
        data: {
          received: bodyData,
          processedAt: new Date().toISOString(),
          processedBy: auth.user.id,
        },
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        },
      });
    }

    if (req.method === 'PUT') {
      const { data: bodyData } = req.body;

      return res.status(200).json({
        success: true,
        message: 'Data updated successfully',
        data: {
          updated: bodyData,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.user.id,
        },
        user: {
          id: auth.user.id,
          email: auth.user.email,
        },
      });
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({
        success: true,
        message: 'Data deleted successfully',
        data: {
          deletedAt: new Date().toISOString(),
          deletedBy: auth.user.id,
        },
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('Protected endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
