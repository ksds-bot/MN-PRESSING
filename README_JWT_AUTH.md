# JWT Authentication Guide

## Overview

This guide provides a complete setup for JWT (JSON Web Token) authentication in your application. It includes middleware setup, protected API routes, and client-side usage examples.

## Features

- ✅ JWT token generation and validation
- ✅ Secure middleware for route protection
- ✅ TypeScript support
- ✅ Error handling and token refresh capability
- ✅ Client-side integration examples
- ✅ React component examples

## Installation

### Prerequisites

```bash
npm install jsonwebtoken
npm install dotenv
```

### Environment Setup

Create a `.env.local` file in your project root:

```env
JWT_SECRET=your_super_secret_key_here_minimum_32_characters
JWT_EXPIRATION=24h
```

**Important:** Keep your `JWT_SECRET` secure and never commit it to version control.

## API Setup

### 1. Authentication Middleware

The middleware validates JWT tokens from request headers:

```typescript
// lib/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export function verifyAuth(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}
```

### 2. Protected API Route

Example of a protected API endpoint:

```typescript
// pages/api/protected.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'Access granted',
    user: auth.user,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  const body = await req.json();

  return NextResponse.json({
    message: 'Data received',
    user: auth.user,
    data: body,
    timestamp: new Date().toISOString(),
  });
}
```

## Client Usage

### Fetching Protected Data

```typescript
import { fetchProtectedData, postProtectedData } from '@/lib/api-client';

// Get token from storage
const token = localStorage.getItem('authToken');

// Fetch data
const data = await fetchProtectedData(token);

// Post data
const response = await postProtectedData(token, {
  name: 'John Doe',
  email: 'john@example.com',
});
```

### React Component Example

```typescript
import { ProtectedDataExample } from '@/lib/api-client';

export default function MyComponent() {
  return (
    <div>
      <h1>Protected Data</h1>
      <ProtectedDataExample />
    </div>
  );
}
```

## Token Management

### Storing Tokens

Store tokens securely on the client:

```typescript
// After successful login
localStorage.setItem('authToken', token);
```

### Refreshing Tokens

Implement token refresh logic:

```typescript
export async function refreshToken(refreshToken: string) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const { token } = await response.json();
  localStorage.setItem('authToken', token);
  return token;
}
```

### Clearing Tokens

```typescript
function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

## Security Best Practices

1. **Never expose secrets**: Keep `JWT_SECRET` in environment variables
2. **Use HTTPS**: Always use HTTPS in production
3. **Token expiration**: Set appropriate expiration times
4. **Secure storage**: Store tokens in httpOnly cookies when possible
5. **Validate tokens**: Always verify tokens on the backend
6. **CORS**: Implement proper CORS policies
7. **Rate limiting**: Implement rate limiting on auth endpoints

## Troubleshooting

### "Invalid token" Error

- Check that the token is not expired
- Verify the `JWT_SECRET` matches between client and server
- Ensure the token format is correct (`Bearer <token>`)

### 401 Unauthorized

- Verify the token exists in the request header
- Check that the Authorization header format is `Bearer <token>`
- Ensure the token is still valid (not expired)

### CORS Issues

Add CORS configuration:

```typescript
import cors from 'cors';

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
});
```

## File Structure

```
lib/
├── api-client.ts          # Client-side API functions
├── middleware/
│   └── auth.ts            # JWT verification middleware
├── utils/
│   └── jwt.ts             # JWT utilities (optional)
pages/
└── api/
    ├── auth/
    │   ├── login.ts       # Login endpoint
    │   ├── logout.ts      # Logout endpoint
    │   └── refresh.ts     # Token refresh endpoint
    └── protected.ts       # Protected endpoint example
```

## Additional Resources

- [JWT.io](https://jwt.io) - JWT documentation
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken) - Library documentation
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Support

For issues or questions, please open an issue on the repository.
