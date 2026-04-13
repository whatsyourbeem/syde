import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase/showcase-detail";

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
  const supabase = await createClient();


  let query = supabase
    .from("showcases")
    .select("id, name, slug, short_description, description, thumbnail_url, images") as any;

  if (isUUID(showcase_id)) {
    query = query.eq("id", showcase_id);
  } else {
    query = query.eq("slug", showcase_id);
  }

  const { data: showcase } = await query.maybeSingle();

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

  const images = [];
  if (showcase.thumbnail_url) images.push(showcase.thumbnail_url);
  if (showcase.images && Array.isArray(showcase.images)) {
    images.push(...showcase.images);
  }
  if (images.length === 0) images.push("/we-are-syders.png");

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

export default async function ShowcaseDetailPage({
  params,
}: ShowcaseDetailPageProps) {
  const resolvedParams = await params;
  const showcase_id = decodeURIComponent(resolvedParams.showcase_id);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();


  let query = supabase
    .from("showcases")
    .select(
      "*, profiles(*), showcase_upvotes(user_id), showcase_comments(id), members:showcases_members(*, profile:profiles(*))"
    ) as any;

  if (isUUID(showcase_id)) {
    query = query.eq("id", showcase_id);
  } else {
    query = query.eq("slug", showcase_id);
  }

  const { data: showcase, error } = await query.maybeSingle();

  if (error || !showcase) {
    notFound();
  }

  // Redirect to slug URL if accessed by ID for SEO
  if (isUUID(showcase_id) && showcase.slug) {
    redirect(`/showcase/${showcase.slug}`);
  }

  // JSON-LD for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": showcase.name,
    "description": showcase.short_description || "SYDE showcase project",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web, iOS, Android",
    "image": showcase.thumbnail_url || "/we-are-syders.png",
    "author": {
      "@type": "Person",
      "name": showcase.profiles?.full_name || showcase.profiles?.username || "SYDER",
    },
    "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/showcase/${showcase.slug || showcase.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShowcaseDetail showcase={showcase as any} user={user} />
    </>
  );
}
