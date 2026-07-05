/**
 * Update Clothing Item API endpoint
 * PUT /api/clothing
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/services/neon-db';
import { verifyAuth } from '@/lib/middleware/auth';

export interface UpdateClothingRequest {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  color?: string;
  size?: string;
  price?: number;
  imagePublicId?: string;
  imageUrl?: string;
}

export interface UpdateClothingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateClothingResponse>
) {
  // Verify authentication
  const auth = verifyAuth(req as any);
  if (!auth.valid || !auth.user) {
    return res.status(401).json({
      success: false,
      error: auth.error || 'Unauthorized',
    });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      id,
      name,
      description,
      type,
      color,
      size,
      price,
      imagePublicId,
      imageUrl,
    } = req.body as UpdateClothingRequest;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Clothing item ID is required',
      });
    }

    // Check if item exists and belongs to user
    const existingItem = await query(
      'SELECT id FROM clothing_items WHERE id = $1 AND user_id = $2',
      [id, auth.user.id]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clothing item not found',
      });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (size !== undefined) {
      updates.push(`size = $${paramCount++}`);
      values.push(size);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (imagePublicId !== undefined) {
      updates.push(`image_public_id = $${paramCount++}`);
      values.push(imagePublicId);
    }
    if (imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(imageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, auth.user.id);

    const result = await query(
      `UPDATE clothing_items SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Clothing item updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update clothing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
