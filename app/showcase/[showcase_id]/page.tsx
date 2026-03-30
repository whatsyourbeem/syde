import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase/showcase-detail";

type ShowcaseDetailPageProps = {
  params: Promise<{
    showcase_id: string;
  }>;
};

export async function generateMetadata(
  { params }: ShowcaseDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { showcase_id } = await params;
  const supabase = await createClient();

  const { data: showcase } = await supabase
    .from("showcases")
    .select("name, short_description, description, thumbnail_url, images")
    .eq("id", showcase_id)
    .single();

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

  return {
    title,
    description: description || "SYDE 쇼케이스 상세페이지",
    openGraph: {
      title,
      description: description || "SYDE 쇼케이스 상세페이지",
      images,
      type: "website",
      url: `/showcase/${showcase_id}`,
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
  const { showcase_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: showcase, error } = await supabase
    .from("showcases")
    .select(
      "*, profiles(*), showcase_upvotes(user_id), showcase_comments(id), members:showcases_members(*, profile:profiles(*))",
    )
    .eq("id", showcase_id)
    .single();

  if (error || !showcase) {
    notFound();
  }

  return <ShowcaseDetail showcase={showcase as any} user={user} />;
}
