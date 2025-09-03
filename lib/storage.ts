import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Upload a file to Supabase Storage and return the public URL
 * @param adminClient - Supabase admin client
 * @param bucket - Storage bucket name
 * @param path - File path in storage
 * @param file - File to upload
 * @returns Promise<string> - Public URL of uploaded file
 * @throws Error if upload fails
 */
export async function uploadAndGetUrl(
  adminClient: SupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  // Validate file
  if (!file || file.size === 0) {
    throw new Error("Invalid file provided");
  }

  // Validate bucket and path
  if (!bucket || !path) {
    throw new Error("Bucket and path are required");
  }

  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(path, file);

  if (uploadError) {
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }

  const { data: urlData } = adminClient.storage
    .from(bucket)
    .getPublicUrl(uploadData.path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param adminClient - Supabase admin client
 * @param bucket - Storage bucket name
 * @param path - File path in storage
 * @returns Promise<void>
 * @throws Error if deletion fails
 */
export async function deleteFile(
  adminClient: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  if (!bucket || !path) {
    throw new Error("Bucket and path are required");
  }

  const { error } = await adminClient.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file at ${path}: ${error.message}`);
  }
}

/**
 * Extract file extension from MIME type
 * @param mimeType - File MIME type
 * @returns string - File extension
 */
export function getFileExtension(mimeType: string): string {
  return mimeType.split("/")[1] || "bin";
}

/**
 * Validate file type and size
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeBytes - Maximum file size in bytes
 * @throws Error if validation fails
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number
): void {
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds limit of ${maxSizeBytes} bytes`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`);
  }
}

// Common file type constants
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/webp",
  "image/gif"
];

export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

// Common size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  THUMBNAIL: 2 * 1024 * 1024, // 2MB
} as const;