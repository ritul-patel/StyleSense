/**
 * Supabase Storage Service for product images.
 *
 * Prerequisites:
 *   1. Create a bucket named "product-images" in Supabase Dashboard → Storage
 *   2. Set the bucket to PUBLIC (so URLs don't need signed tokens)
 *   3. Add a policy: allow authenticated uploads (or service role)
 *
 * This service uses the service role key to upload on behalf of admins.
 */

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceRoleKey } from "../config/supabase";

const BUCKET = "product-images";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a buffer to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadProductImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Sanitize filename to create a clean path
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const path = `products/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    success: true,
    publicUrl: urlData.publicUrl,
    path,
  };
}

/**
 * Delete an image from storage.
 */
export async function deleteProductImage(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

/**
 * Extract a slug from a filename for auto-matching.
 * Example: "black-oversized-tshirt.jpg" → "black-oversized-tshirt"
 */
export function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
