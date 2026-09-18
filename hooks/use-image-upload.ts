"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, FILE_SIZE_LIMIT } from "@/lib/image-compression";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface UseImageUploadResult {
  isUploading: boolean;
  uploadImage: (
    file: File,
    bucket: string,
    pathPrefix?: string,
    compressionType?: "detail" | "thumbnail" | "avatar"
  ) => Promise<string | null>;
}

// One id for every upload error, so a batch of failed images shows one toast instead of a stack.
const UPLOAD_ERROR_TOAST_ID = "image-upload-error";

export function useImageUpload(): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  // Uploads can overlap (several images pasted at once); stay "uploading" until the last one settles,
  // otherwise publish re-enables while images are still on their way.
  const pendingRef = useRef(0);
  const supabase = createClient();

  const uploadImage = async (
    file: File,
    bucket: string,
    pathPrefix: string = "",
    compressionType: "detail" | "thumbnail" | "avatar" = "detail"
  ): Promise<string | null> => {
    if (!file) return null;

    if (file.size > FILE_SIZE_LIMIT) {
      toast.error("이미지는 20MB를 초과할 수 없습니다.", { id: UPLOAD_ERROR_TOAST_ID });
      return null;
    }

    pendingRef.current += 1;
    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다.", { id: UPLOAD_ERROR_TOAST_ID });
        return null;
      }

      // 1. Compress image
      const compressed = await compressImage(file, compressionType);

      // 2. Build unique path
      const cleanedPrefix = pathPrefix && !pathPrefix.endsWith("/") ? `${pathPrefix}/` : pathPrefix;
      const filePath = `${user.id}/${cleanedPrefix}${uuidv4()}`;

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressed, {
          cacheControl: '31536000',
        });

      if (uploadError) {
        throw uploadError;
      }

      // 4. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("이미지 업로드에 실패했습니다.", { id: UPLOAD_ERROR_TOAST_ID });
      return null;
    } finally {
      pendingRef.current -= 1;
      setIsUploading(pendingRef.current > 0);
    }
  };

  return {
    isUploading,
    uploadImage,
  };
}
