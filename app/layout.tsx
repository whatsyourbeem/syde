import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderServer, HeaderSkeleton } from "@/components/layout/header-server";
import { Suspense } from "react";
import { Providers } from "@/components/layout/providers";
import { LoginDialogProvider } from "@/context/LoginDialogContext";
import { LoginDialog } from "@/components/auth/login-dialog";

import { Toaster } from "sonner"; // Import Toaster from sonner
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "사이드프로젝트 커뮤니티 · 1인개발자·솔로프리너 | SYDE",
  description: "주체적인 삶으로 가득한 세상을 꿈꾸는 사이드프로젝트 플랫폼 커뮤니티",
  keywords: [
    "사이드 프로젝트",
    "직장인 부업",
    "팀빌딩",
    "IT 커뮤니티",
    "SYDE",
    "사이드",
    "직장인 사이드 프로젝트",
    "1인 개발",
    "스타트업 네트워킹",
    "커리어 성장",
    "팀원 모집",
    "프로젝트 홍보",
    "서비스 런칭",
    "커피챗",
    "오프라인 모임",
    "기획자 커뮤니티",
    "디자이너 커뮤니티",
    "개발자 커뮤니티",
    "노코드 프로젝트"
  ],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

const paperlogy = localFont({
  src: [
    { path: "../fonts/Paperlogy-1Thin.woff2", weight: "100" },
    { path: "../fonts/Paperlogy-2ExtraLight.woff2", weight: "200" },
    { path: "../fonts/Paperlogy-3Light.woff2", weight: "300" },
    { path: "../fonts/Paperlogy-4Regular.woff2", weight: "400" },
    { path: "../fonts/Paperlogy-5Medium.woff2", weight: "500" },
    { path: "../fonts/Paperlogy-6SemiBold.woff2", weight: "600" },
    { path: "../fonts/Paperlogy-7Bold.woff2", weight: "700" },
    { path: "../fonts/Paperlogy-8ExtraBold.woff2", weight: "800" },
    { path: "../fonts/Paperlogy-9Black.woff2", weight: "900" },
  ],
  display: "swap",
});

import { HeaderNavigation } from "@/components/layout/header-navigation";
import { HeaderNavigationWrapper } from "@/components/layout/header-navigation-wrapper";
import Footer from "@/components/layout/footer"; // Add this import

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.className} antialiased`}>
        <Providers>
          <LoginDialogProvider>
            <div className="flex flex-col min-h-dvh">
              <div className="contents">
                <Suspense fallback={<HeaderSkeleton paperlogyClassName={paperlogy.className} />}>
                  <HeaderServer paperlogyClassName={paperlogy.className} />
                </Suspense>
                <HeaderNavigationWrapper>
                  <HeaderNavigation />
                </HeaderNavigationWrapper>
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
