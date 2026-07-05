/**
 * File Upload API endpoint
 * POST /api/upload
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadFile, CloudinaryUploadResponse } from '@/lib/services/cloudinary';
import { verifyAuth } from '@/lib/middleware/auth';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface UploadResponse {
  success: boolean;
  data?: CloudinaryUploadResponse;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  // Verify authentication
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Read file content
    const fileContent = fs.readFileSync(file.filepath);

    // Upload to Cloudinary
    const result = await uploadFile(fileContent, {
      folder: `${process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'uploads'}/${auth.user.id}`,
      tags: [auth.user.id, auth.user.email].filter(Boolean) as string[],
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}
