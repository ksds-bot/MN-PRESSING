/**
 * User Registration API endpoint
 * POST /api/auth/register
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/services/neon-db';
import { createTokenPair } from '@/lib/middleware/auth';
import bcrypt from 'bcryptjs';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { email, username, password, confirmPassword } = req.body as RegisterRequest;

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email or username already exists',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, username, hashedPassword]
    );

    const user = result.rows[0];

    // Create tokens
    const { accessToken, refreshToken } = createTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
      role: 'user',
    });

    // Set refresh token in cookie
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    ]);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
