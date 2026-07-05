/**
 * JWT Authentication Middleware
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface DecodedToken {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Verify JWT token from request headers
 */
export function verifyAuth(req: NextRequest): {
  valid: boolean;
  user?: DecodedToken;
  error?: string;
} {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return {
        valid: false,
        error: 'Missing authorization header',
      };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        valid: false,
        error: 'Invalid authorization header format. Expected: Bearer <token>',
      };
    }

    const token = parts[1];

    if (!token) {
      return {
        valid: false,
        error: 'Missing token',
      };
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ''
    ) as DecodedToken;

    return {
      valid: true,
      user: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }

    return {
      valid: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Create a new JWT token
 */
export function createToken(
  payload: DecodedToken,
  expiresIn: SignOptions['expiresIn'] = (process.env.JWT_EXPIRATION as SignOptions['expiresIn']) || '24h'
): string {
  return jwt.sign(payload, process.env.JWT_SECRET || '', {
    expiresIn,
  });
}

/**
 * Create access and refresh tokens
 */
export function createTokenPair(payload: DecodedToken): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = createToken(payload, '1h');
  const refreshToken = createToken(payload, '7d');

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Protected route wrapper
 */
export function withAuth(
  handler: (req: NextRequest, context: any, user: DecodedToken) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const auth = verifyAuth(req);

    if (!auth.valid || !auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, context, auth.user);
  };
}

/**
 * Check if user has required role
 */
export function requireRole(requiredRole: string) {
  return (
    handler: (req: NextRequest, context: any, user: DecodedToken) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, context: any) => {
      const auth = verifyAuth(req);

      if (!auth.valid || !auth.user) {
        return NextResponse.json(
          { error: auth.error || 'Unauthorized' },
          { status: 401 }
        );
      }

      if (auth.user.role !== requiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, context, auth.user);
    };
  };
}

/**
 * Verify token and return decoded payload
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ''
    ) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}
