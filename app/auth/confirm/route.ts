import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { uploadAvatarFromUrl } from "@/app/auth/avatar-actions"; // Import the new action

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code); // Get data as well

    if (!error) {
      // On initial social login, set the avatar from the provider
      if (data.user && data.user.user_metadata?.avatar_url) {
        const userId = data.user.id;
        const providerAvatarUrl = data.user.user_metadata.avatar_url;

        // Check if the user already has an avatar
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        // If the user does not have an avatar set, upload the one from the provider
        if (profile && !profile.avatar_url) {
          const newAvatarUrl = await uploadAvatarFromUrl(userId, providerAvatarUrl);

          if (newAvatarUrl) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ avatar_url: newAvatarUrl })
              .eq("id", userId);

            if (updateError) {
              console.error("Error updating profile avatar_url:", updateError);
            }
          }
        }
      }
      return redirect(next);
    } else {
      return redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  return redirect("/auth/error?message=No code found.");
}
