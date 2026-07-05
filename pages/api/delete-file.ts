/**
 * Delete File API endpoint
 * DELETE /api/delete-file
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteFile, CloudinaryDeleteResponse } from '@/lib/services/cloudinary';
import { verifyAuth } from '@/lib/middleware/auth';

export interface DeleteFileResponse {
  success: boolean;
  data?: CloudinaryDeleteResponse;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteFileResponse>
) {
  // Verify authentication
  const auth = verifyAuth(req as any);
  if (!auth.valid || !auth.user) {
    return res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized',
    });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required',
      });
    }

    const result = await deleteFile(publicId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    });
  }
}
