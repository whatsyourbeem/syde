"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Json } from "@/types/database.types";

export async function checkUsername(
  username: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: 'No rows found'
    console.error("Error checking username:", error);
    return false; // Consider this case as "not available" to be safe
  }

  return !data; // Returns true if username is available (no data found), false otherwise
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const username = formData.get("username") as string;
  const full_name = formData.get("full_name") as string;
  const tagline = formData.get("tagline") as string;
  const avatar_url = formData.get("avatar_url") as string | null;

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name,
      tagline,
      avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return redirect(`/auth/error?message=${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/${username}`);
  redirect(`/${username}`);
}

export async function updateBio(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const bioString = formData.get("bio") as string;
  let bio: Json | null = null;
  try {
    bio = JSON.parse(bioString);
  } catch (e) {
    console.error("Failed to parse bio JSON string:", e);
    return { error: "Invalid bio content format." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bio, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating bio:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/${user.user_metadata.username}`);
  return { success: true };
}

export async function uploadBioImage(formData: FormData): Promise<{ publicUrl?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${user.id}/bio/${fileName}`;

  const { error } = await supabase.storage
    .from("profiles")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading bio image:", error);
    return { error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from("profiles")
    .getPublicUrl(filePath);

  return { publicUrl };
}