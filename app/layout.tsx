import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthButton } from "@/components/auth/auth-button";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginModalProvider } from "@/context/LoginModalContext"; // Import LoginModalProvider
import { Providers } from "@/components/layout/providers"; // Import Providers
import { Search } from "lucide-react"; // Import Search icon
import NotificationBell from "@/components/notification/notification-bell";
import { Suspense } from "react";

import { Toaster } from "sonner"; // Import Toaster from sonner

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

import { HeaderNavigation } from "@/components/layout/header-navigation";
import { MobileMenu } from "@/components/layout/mobile-menu";

import { Button } from "@/components/ui/button";

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
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .eq("is_read", false);
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
        ? `${profile.avatar_url}?t=${
            profile.updated_at ? new Date(profile.updated_at).getTime() : ""
          }`
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
            <div className="w-full bg-background">
              <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-5 pt-3 pb-2 text-sm">
                {/* Mobile specific layout */}
                <div className="flex md:hidden w-full justify-between items-center">
                  <div className="flex items-center">
                    <Link href={"/"} className="flex items-center gap-1">
                      <Image
                        src="/logo_no_bg.png"
                        alt="SYDE"
                        width={22}
                        height={22}
                        priority
                      />
                      <span className="text-2xl font-extrabold tracking-tight text-sydenightblue">
                        SYDE
                      </span>
                    </Link>
                  </div>
                  <div className="flex justify-end items-center gap-4">
                    <Link
                      href="/search"
                      className="text-foreground hover:text-primary p-2 rounded-full hover:bg-secondary"
                    >
                      <Search size={20} />
                    </Link>
                    <MobileMenu
                      user={user}
                      notificationBell={
                        <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full" />}>
                          <NotificationBell
                            initialUnreadCount={unreadNotifCount}
                            userId={user?.id || null}
                          />
                        </Suspense>
                      }
                      authButton={
                        <AuthButton
                          avatarUrl={avatarUrl}
                          username={usernameForAuthButton}
                          sheetHeader={true}
                        />
                      }
                    />
                  </div>
                </div>

                {/* Desktop specific layout */}
                <div className="hidden md:flex w-full justify-between items-center">
                  <div className="w-1/3">
                    <Link
                      href="https://open.kakao.com/o/gduSGmtf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 hover:bg-[#FEE500]/20 px-2 md:px-4"
                      >
                        <Image
                          src="/kakao-talk.png"
                          alt="Kakao"
                          width={24}
                          height={24}
                        />
                        <span className="hidden md:inline text-[#4B4737]">SYDE 오픈채팅</span>
                      </Button>
                    </Link>
                  </div>
                  <div className="w-1/3 flex justify-center items-center font-semibold">
                    <Link href={"/"} className="flex items-center gap-1">
                      <Image
                        src="/logo_no_bg.png"
                        alt="SYDE"
                        width={44}
                        height={44}
                        priority
                      />
                      <span className="text-4xl font-extrabold tracking-tight text-sydenightblue">
                        SYDE
                      </span>
                    </Link>
                  </div>
                  <div className="w-1/3 flex justify-end items-center gap-4">
                    <Link
                      href="/search"
                      className="text-foreground hover:text-primary p-2 rounded-full hover:bg-secondary"
                    >
                      <Search size={20} />
                    </Link>
                    <Suspense
                      fallback={
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      }
                    >
                      <NotificationBell
                        initialUnreadCount={unreadNotifCount}
                        userId={user?.id || null}
                      />
                    </Suspense>
                    <AuthButton
                      avatarUrl={avatarUrl}
                      username={usernameForAuthButton}
                      sheetHeader={false}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky top-0 z-40 w-full border-b bg-background">
              <nav className="h-8 md:h-auto w-full max-w-6xl mx-auto flex justify-center items-center px-5">
                <HeaderNavigation />
              </nav>
              
            </div>
            <div className="max-w-6xl mx-auto">{children}</div>
            <Toaster />
          </LoginModalProvider>
        </Providers>
      </body>
    </html>
  );
}
