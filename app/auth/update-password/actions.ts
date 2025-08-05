"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const data = {
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.updateUser({ password: data.password });

  if (error) {
    return redirect(`/auth/error?message=${error.message}`);
  }

  redirect("/");
}
