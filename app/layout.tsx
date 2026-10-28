import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderServer } from "@/components/layout/header-server";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { Providers } from "@/components/layout/providers";
import { AuthProvider } from "@/context/AuthContext";
import { LoginDialogProvider } from "@/context/LoginDialogContext";
import { LoginDialog } from "@/components/auth/login-dialog";

import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/site";


const SITE_TITLE = "사이드프로젝트 커뮤니티 · 1인개발자·솔로프리너 | SYDE";
const SITE_DESCRIPTION = "1인개발자·솔로프리너를 위한 사이드프로젝트 커뮤니티 SYDE. 쇼케이스, 블로그, 모임이 한 곳에 있어요.";

// 사이트 전체에 한 번만 심는 구조화 데이터: 브랜드(Organization)와 사이트(WebSite).
const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SYDE",
    alternateName: "사이드",
    url: SITE_URL,
    logo: absoluteUrl("/icon.png"),
    sameAs: [
      "https://www.instagram.com/syde.kr",
      "https://www.threads.com/@syde.kr",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SYDE",
    url: SITE_URL,
    inLanguage: "ko-KR",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // 하위 페이지가 openGraph를 지정하면 이 객체는 통째로 교체되므로, 여기 값은 지정하지 않은 페이지의 기본값이다.
  // title/description은 일부러 넣지 않는다. 넣으면 자체 openGraph가 없는 페이지의 og:title이 전부 사이트 대표 제목으로 덮어써진다.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
  },
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
  // The site is designed light-only; without this, browsers on a dark OS theme draw dark scrollbars and form controls.
  colorScheme: "light",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Providers>
          <AuthProvider>
            <LoginDialogProvider>
              <div className="flex flex-col min-h-dvh">
                <div className="contents">
                  <AnnouncementBanner />
                  <HeaderServer paperlogyClassName={paperlogy.className} />
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
          </AuthProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
