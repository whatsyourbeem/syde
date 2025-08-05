"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    full_name: formData.get("fullName") as string,
    username: formData.get("username") as string,
  };

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        username: data.username,
      },
    },
  });

  if (error) {
    return redirect(`/auth/error?message=${error.message}`);
  }

  revalidatePath("/", "layout");
  redirect("/auth/sign-up-success");
}
