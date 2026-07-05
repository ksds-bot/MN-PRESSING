/**
 * Get Clothing Items API endpoint
 * GET /api/clothing
 * GET /api/clothing?id=<id>
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/services/neon-db';
import { verifyAuth } from '@/lib/middleware/auth';

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: string;
  color: string;
  size: string;
  price: number;
  image_public_id: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface GetClothingResponse {
  success: boolean;
  data?: ClothingItem | ClothingItem[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetClothingResponse>
) {
  // Verify authentication
  const auth = verifyAuth(req as any);
  if (!auth.valid || !auth.user) {
    return res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized',
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { id } = req.query;

    if (id) {
      // Get single clothing item
      const result = await query(
        'SELECT * FROM clothing_items WHERE id = $1 AND user_id = $2',
        [id, auth.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Clothing item not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    }

    // Get all clothing items for user
    const result = await query(
      'SELECT * FROM clothing_items WHERE user_id = $1 ORDER BY created_at DESC',
      [auth.user.id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get clothing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
