import type { NextApiRequest, NextApiResponse } from 'next';
import { createTokenPair, verifyAuth } from '@/lib/middleware/auth';
import { hashPassword, validatePassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  role?: 'ADMIN' | 'EMPLOYEE';
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
    name: string;
    role: string;
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
    const { email, name, password, confirmPassword, role } = req.body as RegisterRequest;

    if (!email || !name || !password || !confirmPassword) {
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

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.errors.join(', '),
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const userCount = await prisma.user.count();

    if (userCount > 0) {
      const auth = verifyAuth(req as any);
      if (!auth.valid || !auth.user || auth.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: "Seul un administrateur peut créer un nouveau compte",
        });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
    }

    const hashedPassword = await hashPassword(password);
    const finalRole = userCount === 0 ? 'ADMIN' : (role || 'EMPLOYEE');

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: finalRole,
      },
    });

    const { accessToken, refreshToken } = createTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

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
        name: user.name,
        role: user.role,
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
