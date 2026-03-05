import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LogDetail } from "@/components/log/log-detail";

import { Metadata, ResolvingMetadata } from "next";

type LogDetailPageProps = {
  params: Promise<{
    log_id: string;
  }>;
};

export async function generateMetadata(
  { params }: LogDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { log_id } = await params;
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("logs")
    .select("content, image_url, profiles(full_name, username)")
    .eq("id", log_id)
    .single();

  if (!log) {
    return {
      title: "Log Not Found - SYDE",
    };
  }

  const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
  const displayName = profile?.full_name || profile?.username || "Anonymous";
  const title = `${displayName}님의 로그 - SYDE`;

  let plainText = "";
  try {
    const parsed = JSON.parse(log.content);
    const extractText = (node: any): string => {
      if (node.type === "text" && node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(" ");
      }
      return "";
    };
    plainText = extractText(parsed).trim();
  } catch (e) {
    plainText = log.content || "";
  }

  const description = plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText;
  const images = log.image_url ? [log.image_url] : [];

  return {
    title,
    description: description || "SYDE 로그",
    openGraph: {
      title,
      description: description || "SYDE 로그",
      images,
      type: "article",
      url: `/log/${log_id}`,
    },
  };
}

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  const { log_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: log, error } = await supabase
    .from("logs")
    .select("*, profiles(*), log_likes(user_id), log_bookmarks(user_id), log_comments(id)")
    .eq("id", log_id)
    .single();

  if (error || !log) {
    notFound();
  }

  return <LogDetail log={log} user={user} />;
}