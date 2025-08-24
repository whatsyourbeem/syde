"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// layout.tsx에서 사용하는 것과 동일한 URL 생성 로직
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export async function loginWithGoogle() {
  const supabase = await createClient();
  const origin = getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}auth/confirm`,
    },
  });

  if (error) {
    return redirect(`/auth/error?error=${error.message}`);
  }

  return redirect(data.url);
}

export async function loginWithKakao() {
  const supabase = await createClient();
  const origin = getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${origin}auth/confirm`,
    },
  });

  if (error) {
    return redirect(`/auth/error?error=${error.message}`);
  }

  return redirect(data.url);
}
