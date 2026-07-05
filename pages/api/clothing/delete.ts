/**
 * Delete Clothing Item API endpoint
 * DELETE /api/clothing?id=<id>
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/services/neon-db';
import { verifyAuth } from '@/lib/middleware/auth';
import { deleteFile } from '@/lib/services/cloudinary';

export interface DeleteClothingResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteClothingResponse>
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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Clothing item ID is required',
      });
    }

    // Get clothing item
    const itemResult = await query(
      'SELECT image_public_id FROM clothing_items WHERE id = $1 AND user_id = $2',
      [id, auth.user.id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clothing item not found',
      });
    }

    const imagePublicId = itemResult.rows[0].image_public_id;

    // Delete image from Cloudinary
    try {
      await deleteFile(imagePublicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await query('DELETE FROM clothing_items WHERE id = $1 AND user_id = $2', [id, auth.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Clothing item deleted successfully',
    });
  } catch (error) {
    console.error('Delete clothing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
