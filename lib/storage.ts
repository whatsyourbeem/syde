import {
  SupabaseClient,
  createClient as createAdminClient,
} from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

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

  const { error } = await adminClient.storage.from(bucket).remove([path]);

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
    throw new Error(
      `File type ${
        file.type
      } is not allowed. Allowed types: ${allowedTypes.join(", ")}`
    );
  }
}

// Common file type constants
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Common size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  THUMBNAIL: 2 * 1024 * 1024, // 2MB
} as const;

interface HandleClubContentImagesParams {
  formData: FormData;
  resourceId: string;
  bucketName: string;
  contentJson: string;
  existingThumbnailUrl?: string | null;
}

interface HandleClubContentImagesResult {
  thumbnailUrl: string | null;
  processedContent: unknown;
}

export async function handleClubContentImages({
  formData,
  resourceId,
  bucketName,
  contentJson,
  existingThumbnailUrl = null,
}: HandleClubContentImagesParams): Promise<HandleClubContentImagesResult> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const descriptionImageFiles = formData.getAll(
    "descriptionImageFiles"
  ) as File[];

  let newThumbnailUrl = existingThumbnailUrl;
  let processedContent = JSON.parse(contentJson);

  // 1. Handle Thumbnail
  if (thumbnailFile && thumbnailFile.size > 0) {
    const fileExt = getFileExtension(thumbnailFile.type);
    const thumbnailPath = `${resourceId}/thumbnail/${uuidv4()}.${fileExt}`;
    newThumbnailUrl = await uploadAndGetUrl(
      adminClient,
      bucketName,
      thumbnailPath,
      thumbnailFile
    );

    // Delete old thumbnail if it exists
    if (existingThumbnailUrl) {
      try {
        const oldThumbnailPath = existingThumbnailUrl.split(
          `/${bucketName}/`
        )[1];
        await deleteFile(adminClient, bucketName, oldThumbnailPath);
      } catch (error) {
        console.warn("Failed to delete old thumbnail:", error);
      }
    }
  }

  // 2. Handle Description Images
  if (
    descriptionImageFiles.length > 0 &&
    descriptionImageFiles.some((f) => f.size > 0)
  ) {
    const uploadPromises = descriptionImageFiles.map(async (file, index) => {
      if (file.size === 0) return null;
      const blobUrl = formData.get(
        `descriptionImageBlobUrl_${index}`
      ) as string;
      if (!blobUrl) return null;

      const fileExt = getFileExtension(file.type);
      const descriptionPath = `${resourceId}/description/${uuidv4()}.${fileExt}`;
      const publicUrl = await uploadAndGetUrl(
        adminClient,
        bucketName,
        descriptionPath,
        file
      );
      return { blobUrl, publicUrl };
    });

    const uploadedImages = (await Promise.all(uploadPromises)).filter(
      Boolean
    ) as { blobUrl: string; publicUrl: string }[];

    if (uploadedImages.length > 0) {
      let descriptionString = JSON.stringify(processedContent);
      uploadedImages.forEach(({ blobUrl, publicUrl }) => {
        if (blobUrl && publicUrl) {
          // Use a regex with a global flag to replace all occurrences
          descriptionString = descriptionString.replace(
            new RegExp(blobUrl, "g"),
            publicUrl
          );
        }
      });
      processedContent = JSON.parse(descriptionString);
    }
  }

  return {
    thumbnailUrl: newThumbnailUrl,
    processedContent,
  };
}

interface HandlePostContentImagesParams {
  formData: FormData;
  clubId: string;
  forumId: string;
  postId: string;
  contentJson: string;
}

interface HandlePostContentImagesResult {
  processedContent: unknown;
}

export async function handlePostContentImages({
  formData,
  clubId,
  forumId,
  postId,
  contentJson,
}: HandlePostContentImagesParams): Promise<HandlePostContentImagesResult> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const descriptionImageFiles = formData.getAll(
    "descriptionImageFiles"
  ) as File[];
  let processedContent = JSON.parse(contentJson);

  if (
    descriptionImageFiles.length > 0 &&
    descriptionImageFiles.some((f) => f.size > 0)
  ) {
    const uploadPromises = descriptionImageFiles.map(async (file, index) => {
      if (file.size === 0) return null;
      const blobUrl = formData.get(
        `descriptionImageBlobUrl_${index}`
      ) as string;
      if (!blobUrl) return null;

      const fileExt = getFileExtension(file.type);
      const path = `${clubId}/forums/${forumId}/posts/${postId}/${uuidv4()}.${fileExt}`;
      const publicUrl = await uploadAndGetUrl(
        adminClient,
        "clubs", // Posts are stored in the 'clubs' bucket
        path,
        file
      );
      return { blobUrl, publicUrl };
    });

    const uploadedImages = (await Promise.all(uploadPromises)).filter(
      Boolean
    ) as { blobUrl: string; publicUrl: string }[];

    if (uploadedImages.length > 0) {
      let contentString = JSON.stringify(processedContent);
      uploadedImages.forEach(({ blobUrl, publicUrl }) => {
        if (blobUrl && publicUrl) {
          contentString = contentString.replace(
            new RegExp(blobUrl, "g"),
            publicUrl
          );
        }
      });
      processedContent = JSON.parse(contentString);
    }
  }

  return { processedContent };
}

export async function handleLogImage(
  logId: string,
  imageFile: File | null,
  imageRemoved: boolean,
  currentImageUrl?: string | null
): Promise<string | null | undefined> {
  if (!imageFile && !imageRemoved) {
    return undefined; // No change
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete the old image if a new one is uploaded or if removal is requested
  if (currentImageUrl && (imageFile || imageRemoved)) {
    try {
      const oldPath = currentImageUrl.split("/logs/").pop();
      if (oldPath) {
        await deleteFile(adminClient, "logs", oldPath);
      }
    } catch (error) {
      console.warn("Failed to delete old log image:", error);
    }
  }

  // Upload a new image if provided
  if (imageFile && imageFile.size > 0) {
    const fileName = `${logId}/${uuidv4()}`;
    return await uploadAndGetUrl(adminClient, "logs", fileName, imageFile);
  }

  // Return null if the image was removed
  if (imageRemoved) {
    return null;
  }

  return undefined;
}

export async function deleteLogStorage(logId: string): Promise<void> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: files, error: listError } = await adminClient.storage
    .from("logs")
    .list(logId);

  if (listError) {
    console.error(
      `Error listing log files for deletion (logId: ${logId}):`,
      listError
    );
    // Do not throw, allow log deletion to proceed
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${logId}/${file.name}`);
    const { error: removeError } = await adminClient.storage
      .from("logs")
      .remove(filePaths);

    if (removeError) {
      console.error(`Error removing log files (logId: ${logId}):`, removeError);
      // Do not throw, allow log deletion to proceed
    }
  }
}

export async function handleShowcaseImage(
  showcaseId: string,
  imageFile: File | null,
  imageRemoved: boolean,
  currentImageUrl?: string | null
): Promise<string | null | undefined> {
  if (!imageFile && !imageRemoved) {
    return undefined; // No change
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete the old image if a new one is uploaded or if removal is requested
  if (currentImageUrl && (imageFile || imageRemoved)) {
    try {
      const oldPath = currentImageUrl.split("/showcases/").pop();
      if (oldPath) {
        await deleteFile(adminClient, "showcases", oldPath);
      }
    } catch (error) {
      console.warn("Failed to delete old showcase image:", error);
    }
  }

  // Upload a new image if provided
  if (imageFile) {
    const fileName = `${showcaseId}/${uuidv4()}`;
    return await uploadAndGetUrl(adminClient, "showcases", fileName, imageFile);
  }

  // Return null if the image was removed
  if (imageRemoved) {
    return null;
  }

  return undefined;
}

export async function deleteShowcaseStorage(showcaseId: string): Promise<void> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: files, error: listError } = await adminClient.storage
    .from("showcases")
    .list(showcaseId);

  if (listError) {
    console.error(
      `Error listing showcase files for deletion (showcaseId: ${showcaseId}):`,
      listError
    );
    // Do not throw, allow showcase deletion to proceed
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${showcaseId}/${file.name}`);
    const { error: removeError } = await adminClient.storage
      .from("showcases")
      .remove(filePaths);

    if (removeError) {
      console.error(`Error removing showcase files (showcaseId: ${showcaseId}):`, removeError);
      // Do not throw, allow showcase deletion to proceed
    }
  }
}
