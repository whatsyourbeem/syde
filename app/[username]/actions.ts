"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Json } from "@/types/database.types";
import { revalidateTagSafe } from "@/lib/server-utils";

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
  const link = formData.get("link") as string;
  const avatar_url = formData.get("avatar_url") as string | null;
  const tagsString = formData.get("tags") as string | null;

  let tags: string[] = [];
  if (tagsString) {
    try {
      const parsed = JSON.parse(tagsString);
      if (Array.isArray(parsed)) {
        tags = Array.from(
          new Set(
            parsed
              .map((tag) => String(tag).replace(/^#/, "").trim())
              .filter((tag) => tag.length > 0 && tag.length <= 12)
          )
        ).slice(0, 3);
      }
    } catch (e) {
      console.error("Failed to parse tags JSON string:", e);
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name,
      tagline,
      link,
      avatar_url,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return redirect(`/auth/error?message=${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/@${username}`);
  revalidateTagSafe("profile-all");
  revalidateTagSafe(`profile-${username}`);
  redirect(`/@${username}`);
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
  revalidatePath(`/@${user.user_metadata.username}`);
  revalidateTagSafe("profile-all");
  revalidateTagSafe(`profile-${user.user_metadata.username}`);
  return { success: true };
}
