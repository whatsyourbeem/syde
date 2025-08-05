"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const bio = formData.get("bio") as string;

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