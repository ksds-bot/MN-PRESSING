/**
 * Login API endpoint
 * POST /api/auth/login
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createTokenPair } from '@/lib/middleware/auth';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * Mock user database for example
 * In production, validate against your actual database
 */
const mockUsers = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    username: 'johndoe',
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const { accessToken, refreshToken } = createTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
      role: 'user',
    });

    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
