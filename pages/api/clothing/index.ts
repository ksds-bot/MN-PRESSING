/**
 * Create Clothing Item API endpoint
 * POST /api/clothing
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/services/neon-db';
import { verifyAuth } from '@/lib/middleware/auth';

export interface CreateClothingRequest {
  name: string;
  description?: string;
  type: string; // 'shirt', 'pants', 'dress', etc.
  color: string;
  size: string;
  price: number;
  imagePublicId: string; // Cloudinary public ID
  imageUrl: string; // Cloudinary secure URL
}

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

export interface CreateClothingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: ClothingItem;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateClothingResponse>
) {
  // Verify authentication
  const auth = verifyAuth(req as any);
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
    const {
      name,
      description,
      type,
      color,
      size,
      price,
      imagePublicId,
      imageUrl,
    } = req.body as CreateClothingRequest;

    // Validation
    if (!name || !type || !color || !size || price === undefined || !imagePublicId || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price cannot be negative',
      });
    }

    // Create clothing item
    const result = await query(
      `INSERT INTO clothing_items (user_id, name, description, type, color, size, price, image_public_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, name, description, type, color, size, price, image_public_id, image_url, created_at, updated_at`,
      [auth.user.id, name, description || null, type, color, size, price, imagePublicId, imageUrl]
    );

    const clothingItem = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Clothing item created successfully',
      data: clothingItem,
    });
  } catch (error) {
    console.error('Create clothing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
