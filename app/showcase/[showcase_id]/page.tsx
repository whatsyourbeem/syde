import { Metadata, ResolvingMetadata } from "next";
import { createStaticClient } from "@/lib/supabase/static";
import { notFound, redirect } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase/showcase-detail";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";
import { getShowcaseDetailCached, OptimizedShowcase } from "@/lib/queries/showcase-queries";

type ShowcaseDetailPageProps = {
  params: Promise<{
    showcase_id: string;
  }>;
};

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function generateMetadata(
  { params }: ShowcaseDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const showcase_id = decodeURIComponent(resolvedParams.showcase_id);
  const supabase = createStaticClient();

  const showcase = await getShowcaseDetailCached(supabase, showcase_id);

  if (!showcase) {
    return {
      title: "Showcase Not Found - SYDE",
    };
  }

  const title = `${showcase.name || "제목 없음"} - SYDE 쇼케이스`;
  
  let description = showcase.short_description || "";
  
  if (!description && showcase.description) {
    try {
      const parsed = typeof showcase.description === "string" 
        ? JSON.parse(showcase.description) 
        : showcase.description;
        
      const extractText = (node: any): string => {
        if (!node) return "";
        if (node.type === "text" && node.text) return node.text;
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join(" ");
        }
        return "";
      };
      
      if (typeof parsed === "object" && parsed !== null) {
        const plainText = extractText(parsed).trim();
        description = plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText;
      } else {
        description = String(showcase.description).slice(0, 160);
      }
    } catch (e) {
      description = String(showcase.description).slice(0, 160);
    }
  }

  // Supabase Cached Egress 절약을 위해 OG 이미지는 썸네일 1장만 노출한다.
  // 상세 이미지(images)까지 넣으면 크롤러/링크 미리보기 봇이 쇼케이스당 최대 5장(장당 최대 1MB)을 내려받는다.
  const ogImage =
    showcase.thumbnail_url ||
    (Array.isArray(showcase.images) ? showcase.images[0] : null) ||
    "/we-are-syders.png";
  const images = [ogImage];

  // Dynamic Keywords
  const keywords = ["SYDE", "사이드프로젝트", "쇼케이스", "IT 커뮤니티"];
  if (showcase.name) keywords.push(showcase.name);
  if (showcase.short_description) {
    const words = (showcase.short_description as string).split(/\s+/).filter((w: string) => w.length > 1);
    keywords.push(...words.slice(0, 5));
  }

  const url = `/showcase/${showcase.slug || showcase.id}`;

  return {
    title,
    description: description || "SYDE 쇼케이스 상세페이지",
    keywords: keywords.join(", "),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: description || "SYDE 쇼케이스 상세페이지",
      images,
      type: "website",
      url,
      siteName: "SYDE",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || "SYDE 쇼케이스 상세페이지",
      images,
    },
  };
}

// Matches the 1h TTL already used by getShowcaseDetailCached, so this
// doesn't introduce staleness beyond what that cache already allows.
export const revalidate = 3600;

// Required for ISR on a dynamic segment with no known params at build time —
// without this, `revalidate` alone doesn't make the route eligible for caching.
export async function generateStaticParams() {
  return [];
}

export default async function ShowcaseDetailPage({
  params,
}: ShowcaseDetailPageProps) {
  const resolvedParams = await params;
  const showcase_id = decodeURIComponent(resolvedParams.showcase_id);
  // Cookie-free client: keeps this page eligible for the Full Route Cache/ISR.
  // Per-viewer state (upvote status, edit menu) is resolved client-side instead.
  const supabase = createStaticClient();

  const showcase = await getShowcaseDetailCached(supabase, showcase_id);

  if (!showcase) {
    notFound();
  }

  // Redirect to slug URL if accessed by ID for SEO
  if (isUUID(showcase_id) && showcase.slug) {
    redirect(`/showcase/${showcase.slug}`);
  }

  const initialHtml = getInitialHtmlFromTiptap(showcase.description);

  // JSON-LD for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": showcase.name,
    "description": showcase.short_description || "SYDE showcase project",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web, iOS, Android",
    "image": showcase.thumbnail_url || `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/we-are-syders.png`,
    "author": {
      "@type": "Person",
      "name": showcase.profiles?.full_name || showcase.profiles?.username || "SYDER",
      "url": showcase.profiles?.username ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/@${showcase.profiles.username}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr")
    },
    "publisher": {
      "@type": "Organization",
      "name": "SYDE (사이드프로젝트 커뮤니티)",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/icon.png`
      }
    },
    "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/showcase/${showcase.slug || showcase.id}`,
  };

  // Normalize showcase data for consistency
  const processedShowcase: OptimizedShowcase = {
    ...showcase,
    profiles: Array.isArray(showcase.profiles) ? showcase.profiles[0] : showcase.profiles,
    upvotesCount: showcase.upvotes_count?.[0]?.count || 0,
    // Resolved client-side (ShowcaseDetail already filters showcase_upvotes,
    // which is public data, against the viewer's id once it's known).
    hasUpvoted: false,
    showcase_awards: showcase.showcase_awards || [],
    showcase_upvotes: showcase.showcase_upvotes || [],
    showcase_comments: showcase.showcase_comments || [],
    members: (showcase.members || []).map((m: any) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
    })).sort((a: any, b: any) => a.display_order - b.display_order),
  } as unknown as OptimizedShowcase;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShowcaseDetail showcase={processedShowcase} initialHtml={initialHtml} />
    </>
  );
}
