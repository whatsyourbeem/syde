"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
  };

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/update-password`,
  });

  if (error) {
    return redirect(`/auth/error?message=${error.message}`);
  }

  redirect("/auth/forgot-password?message=Password reset email sent");
}
