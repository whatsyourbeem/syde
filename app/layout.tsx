import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthButton } from "@/components/auth-button";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginModalProvider } from "@/context/LoginModalContext"; // Import LoginModalProvider
import { Providers } from "@/components/providers"; // Import Providers
import { Search } from "lucide-react"; // Import Search icon
import NotificationBell from "@/components/notification/notification-bell";
import { Suspense } from "react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const pretendard = localFont({
  src: [
    { path: "../fonts/Pretendard-Thin.ttf", weight: "100" },
    { path: "../fonts/Pretendard-ExtraLight.ttf", weight: "200" },
    { path: "../fonts/Pretendard-Light.ttf", weight: "300" },
    { path: "../fonts/Pretendard-Regular.ttf", weight: "400" },
    { path: "../fonts/Pretendard-Medium.ttf", weight: "500" },
    { path: "../fonts/Pretendard-SemiBold.ttf", weight: "600" },
    { path: "../fonts/Pretendard-Bold.ttf", weight: "700" },
    { path: "../fonts/Pretendard-ExtraBold.ttf", weight: "800" },
    { path: "../fonts/Pretendard-Black.ttf", weight: "900" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl = null;
  let usernameForAuthButton = null;
  let unreadNotifCount = 0;
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', user.id)
      .eq('is_read', false);
    unreadNotifCount = count ?? 0;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url, updated_at, username")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for layout:", profileError);
    } else if (profile) {
      avatarUrl = profile.avatar_url
        ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ''}`
        : null;
      usernameForAuthButton =
        profile.username || user.email?.split("@")[0] || null;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${pretendard.className} antialiased`}>
        <Providers>
          {" "}
          {/* Wrap with Providers */}
          <LoginModalProvider>
            {" "}
            {/* Wrap with LoginModalProvider */}
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Link href={"/"} className="flex items-center gap-2">
                    <Image
                      src="/logo_no_bg.png"
                      alt="SYDE"
                      width={50}
                      height={50}
                      priority
                    />
                    <span className="text-4xl font-black">SYDE</span>
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/search" className="text-foreground hover:text-primary">
                    <Search size={20} />
                  </Link>
                  <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full" />}>
                    <NotificationBell initialUnreadCount={unreadNotifCount} userId={user?.id ?? null} />
                  </Suspense>
                  <AuthButton
                    avatarUrl={avatarUrl}
                    username={usernameForAuthButton}
                  />
                </div>
              </div>
            </nav>
            {children}
          </LoginModalProvider>
        </Providers>
      </body>
    </html>
  );
}