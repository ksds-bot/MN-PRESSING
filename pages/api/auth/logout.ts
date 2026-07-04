/**
 * Logout API endpoint
 * POST /api/auth/logout
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
