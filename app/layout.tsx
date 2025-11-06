import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthButton } from "@/components/auth/auth-button";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { LoginDialogProvider } from "@/context/LoginDialogContext";
import { LoginDialog } from "@/components/auth/login-dialog";

import { Providers } from "@/components/layout/providers"; // Import Providers
import { Search } from "lucide-react"; // Import Search icon
import NotificationBell from "@/components/notification/notification-bell";
import { Suspense } from "react";

import { Toaster } from "sonner"; // Import Toaster from sonner
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "SYDE - 사이드프로젝트 커뮤니티",
  description:
    "주체적인 삶으로 가득한 세상을 꿈꾸는 사이드프로젝터들의 커뮤니티입니다.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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

const paperlogy = localFont({
  src: [
    { path: "../fonts/Paperlogy-1Thin.ttf", weight: "100" },
    { path: "../fonts/Paperlogy-2ExtraLight.ttf", weight: "200" },
    { path: "../fonts/Paperlogy-3Light.ttf", weight: "300" },
    { path: "../fonts/Paperlogy-4Regular.ttf", weight: "400" },
    { path: "../fonts/Paperlogy-5Medium.ttf", weight: "500" },
    { path: "../fonts/Paperlogy-6SemiBold.ttf", weight: "600" },
    { path: "../fonts/Paperlogy-7Bold.ttf", weight: "700" },
    { path: "../fonts/Paperlogy-8ExtraBold.ttf", weight: "800" },
    { path: "../fonts/Paperlogy-9Black.ttf", weight: "900" },
  ],
  display: "swap",
});

import { HeaderNavigation } from "@/components/layout/header-navigation";
import { MobileMenu } from "@/components/layout/mobile-menu";
import Footer from "@/components/layout/footer"; // Add this import

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  let fullNameForAuthButton = null;
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
      .select("avatar_url, updated_at, username, full_name")
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
      fullNameForAuthButton = profile.full_name || usernameForAuthButton;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${pretendard.className} antialiased`}>
        <Providers>
          <LoginDialogProvider>
            <div className="flex flex-col min-h-dvh">
              <header>
                <div className="w-full bg-background">
                  <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-5 pt-3 pb-2 text-sm">
                    {/* Mobile specific layout */}
                    <div className="flex md:hidden w-full justify-between items-center">
                      <div className="flex items-center">
                        <Link href={"/"} className="flex items-center gap-1">
                          <Image
                            src="/logo_no_bg.png"
                            alt="SYDE"
                            width={36}
                            height={36}
                            priority
                          />
                          <span
                            className={`text-2xl font-extrabold text-sydenightblue ${paperlogy.className}`}
                          >
                            <span style={{ letterSpacing: "0.01em" }}>S</span>
                            <span style={{ letterSpacing: "0.01em" }}>Y</span>
                            <span style={{ letterSpacing: "0em" }}>DE</span>
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
                        <MobileMenu
                          user={user}
                          authButton={
                            <AuthButton
                              avatarUrl={avatarUrl}
                              username={usernameForAuthButton}
                              fullName={fullNameForAuthButton}
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
                            <span className="hidden md:inline text-[#4B4737]">
                              SYDE 오픈채팅
                            </span>
                          </Button>
                        </Link>
                      </div>
                      <div className="w-1/3 flex justify-center items-center font-semibold">
                        <Link href={"/"} className="flex items-center gap-1">
                          <Image
                            src="/logo_no_bg.png"
                            alt="SYDE"
                            width={52}
                            height={52}
                            priority
                          />
                          <span
                            className={`text-4xl font-extrabold text-sydenightblue ${paperlogy.className}`}
                          >
                            <span style={{ letterSpacing: "0.01em" }}>S</span>
                            <span style={{ letterSpacing: "0.01em" }}>Y</span>
                            <span style={{ letterSpacing: "0em" }}>DE</span>
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
                          fullName={fullNameForAuthButton}
                          sheetHeader={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </header>
              <div className="sticky top-0 z-40 w-full bg-background">
                <nav className="md:h-auto w-full max-w-6xl mx-auto flex justify-center items-center px-5">
                  <HeaderNavigation />
                </nav>
                <Separator />
              </div>
              <main className="flex-1 h-full">{children}</main>
              <Toaster />
              <LoginDialog />
              <Footer />
            </div>
          </LoginDialogProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
