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

export async function loginWithTestAccount() {
  // 보안: 운영 환경(Production)에서는 이 함수가 작동하지 않도록 차단
  if (process.env.NODE_ENV !== "development") {
    throw new Error("테스트 계정 로그인은 로컬 개발 환경에서만 허용됩니다.");
  }

  const supabase = await createClient();
  const testEmail = "test@example.com";
  const testPassword = "password123";

  // 1. Try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    // 2. If sign in fails, try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: "testuser",
          full_name: "Test User",
        },
      },
    });

    if (signUpError) {
      return redirect(`/auth/error?error=${signUpError.message}`);
    }

    // In local dev with auto-confirm, signUp might already log in or we might need to re-log.
    if (signUpData.session) {
      return redirect("/");
    }
  }

  return redirect("/");
}
