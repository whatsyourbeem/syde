import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LogDetail } from "./log-detail";

export const dynamic = 'force-dynamic';

type LogDetailPageProps = {
  params: {
    log_id: string;
  };
};

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  const { log_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: log, error } = await supabase
    .from("logs")
    .select("*, profiles(*), log_likes(user_id), log_comments(id)")
    .eq("id", log_id)
    .single();

  if (error || !log) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <LogDetail log={log} user={user} />
    </div>
  );
}