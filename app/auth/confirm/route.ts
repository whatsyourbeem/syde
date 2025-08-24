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
      // Check if user exists and has an avatar URL from OAuth provider
      if (data.user && data.user.user_metadata && data.user.user_metadata.avatar_url) {
        const providerAvatarUrl = data.user.user_metadata.avatar_url;
        const userId = data.user.id;

        // Upload avatar to Supabase Storage
        const newAvatarUrl = await uploadAvatarFromUrl(userId, providerAvatarUrl);

        // If upload was successful, update the user's profile in public.profiles
        if (newAvatarUrl) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', userId);

          if (updateError) {
            console.error("Error updating profile avatar_url:", updateError);
            // Decide how to handle this error: redirect to error page or proceed
            // For now, we'll just log and proceed, as login itself was successful
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
