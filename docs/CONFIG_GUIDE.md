# Configuration Guide - Vercel, Neon & Cloudinary

## 📋 Table of Contents
1. [Vercel Configuration](#vercel-configuration)
2. [Neon Database Setup](#neon-database-setup)
3. [Cloudinary Configuration](#cloudinary-configuration)
4. [Environment Variables](#environment-variables)

---

## Vercel Configuration

### 1. Deploy to Vercel
```bash
# Option 1: Using Vercel CLI
npm i -g vercel
vercel

# Option 2: GitHub Integration
# Push code to GitHub and connect via Vercel Dashboard
```

### 2. Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

```env
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app
JWT_SECRET=<your-secure-jwt-secret-min-32-chars>
JWT_EXPIRATION=24h
DATABASE_URL=<your-neon-connection-string>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

### 3. Vercel Settings
- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## Neon Database Setup

### 1. Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up or log in
3. Click **New Project**
4. Select **PostgreSQL** version
5. Choose region closest to your app

### 2. Get Connection String

1. In Neon console, go to **Connection strings**
2. Copy the **PostgreSQL** connection string
3. Format: `postgresql://user:password@host:port/database?sslmode=require`

### 3. Database Configuration

```typescript
// lib/services/neon-db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
```

### 4. Create Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_id VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(public_id)
);

-- Indexes
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_public_id ON files(public_id);
```

### 5. Test Connection

```bash
# Using psql
psql "postgresql://user:password@host:port/database?sslmode=require"

# Test query
SELECT version();
```

---

## Cloudinary Configuration

### 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify email

### 2. Get API Credentials

1. Go to **Dashboard**
2. Copy:
   - **Cloud Name** (under your avatar)
   - **API Key** (in Account Settings)
   - **API Secret** (in Account Settings)

### 3. Create Upload Preset

1. Go to **Settings → Upload**
2. Click **Add upload preset**
3. Name: `your-preset-name`
4. Signing Mode: **Unsigned** (for public uploads)
5. Allowed file types: Image, Video, Raw
6. Resource type: Auto
7. Save and copy preset name

### 4. Configuration

```typescript
// lib/services/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### 5. Upload Methods

#### Server-Side Upload
```typescript
import { uploadFile } from '@/lib/services/cloudinary';

const result = await uploadFile(fileBuffer, {
  folder: 'uploads',
  tags: ['user-upload'],
});
```

#### Client-Side Upload
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', 'your-preset-name');
formData.append('cloud_name', 'your-cloud-name');

const response = await fetch(
  'https://api.cloudinary.com/v1_1/your-cloud-name/image/upload',
  {
    method: 'POST',
    body: formData,
  }
);
```

---

## Environment Variables

### Local Development (.env.local)

```env
# NEXT.JS
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_characters_long
JWT_EXPIRATION=24h

# NEON DATABASE
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-1.neon.tech/dbname

# CLOUDINARY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_CLOUDINARY_FOLDER=mn-pressing
```

### Production (Vercel)

Add all variables in **Vercel Dashboard → Settings → Environment Variables**

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.1.0",
    "cloudinary": "^1.40.0",
    "next-cloudinary": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/pg": "^8.10.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

### Install
```bash
npm install pg jsonwebtoken cloudinary next-cloudinary formidable
npm install -D @types/pg @types/jsonwebtoken @types/node
```

---

## Testing

### Test Database Connection
```typescript
// pages/api/test-db.ts
import { query } from '@/lib/services/neon-db';

export default async function handler(req, res) {
  try {
    const result = await query('SELECT NOW()');
    res.status(200).json({ success: true, timestamp: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Test Cloudinary
```typescript
// pages/api/test-cloudinary.ts
import { getImageUrl } from '@/lib/services/cloudinary';

export default async function handler(req, res) {
  try {
    const url = getImageUrl('sample', {
      width: 400,
      height: 400,
      crop: 'fill',
    });
    res.status(200).json({ success: true, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## Troubleshooting

### Neon Connection Issues
- Check DATABASE_URL format
- Verify SSL mode is enabled
- Test with psql command
- Check firewall settings

### Cloudinary Upload Fails
- Verify cloud_name is correct
- Check API key and secret
- Ensure upload preset is created
- Check file size limits (100MB default)

### Vercel Deployment
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Test locally with same env vars
- Check Node.js version compatibility

---

## Security Best Practices

✅ **DO:**
- Use environment variables for secrets
- Enable JWT expiration
- Use HTTPS only
- Validate file uploads
- Use parameterized queries
- Keep dependencies updated

❌ **DON'T:**
- Commit .env files
- Expose API secrets
- Trust client-side validation
- Allow unlimited file sizes
- Use weak JWT secrets

---

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Cloudinary API](https://cloudinary.com/documentation/cloudinary_api)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
