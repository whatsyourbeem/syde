"use server";

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from 'uuid';

// This function will download the image from the URL and upload it to Supabase Storage
export async function uploadAvatarFromUrl(userId: string, imageUrl: string) {
  const supabase = await createClient();

  try {
    // 1. Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const imageBlob = await response.blob();

    // 2. Upload to Supabase Storage
    const fileExt = imageBlob.type.split('/')[1]; // e.g., 'jpeg', 'png'
    const filePath = `${userId}/avatar/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles') // Use the 'profiles' bucket
      .upload(filePath, imageBlob, {
        cacheControl: '3600',
        upsert: true, // Overwrite if file exists (though UUID should prevent this)
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error("Error uploading avatar from URL:", error);
    return null;
  }
}
