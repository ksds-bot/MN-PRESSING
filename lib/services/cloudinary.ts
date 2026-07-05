/**
 * Cloudinary Configuration and Utilities
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}

export interface CloudinaryDeleteResponse {
  result: string;
}

/**
 * Upload file to Cloudinary
 */
export async function uploadFile(
  file: Buffer | string,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    format?: string;
    tags?: string[];
  } = {}
): Promise<CloudinaryUploadResponse> {
  try {
    const uploadOptions = {
      folder: options.folder || process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'uploads',
      resource_type: options.resource_type || 'auto',
      ...(options.public_id && { public_id: options.public_id }),
      ...(options.tags && { tags: options.tags }),
    };

    const result = await cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
      uploadOptions
    );

    return result as CloudinaryUploadResponse;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<CloudinaryDeleteResponse> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result as CloudinaryDeleteResponse;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Get Cloudinary URL for an image with transformations
 */
export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'pad' | 'scale';
    quality?: 'auto' | 'good' | 'better' | 'best';
    format?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    format: options.format || 'auto',
  });
}

/**
 * Get upload preset for client-side uploads
 */
export function getUploadPreset(): string {
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!preset) {
    throw new Error('CLOUDINARY_UPLOAD_PRESET is not defined');
  }
  return preset;
}

/**
 * Generate signature for secure uploads
 */
export function generateSignature(
  params: Record<string, any>
): { timestamp: number; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return { timestamp, signature };
}

export default cloudinary;
