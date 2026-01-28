import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase/showcase-detail";

type ShowcaseDetailPageProps = {
  params: Promise<{
    showcase_id: string;
  }>;
};

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
      "*, profiles(*), showcase_likes(user_id), showcase_bookmarks(user_id), showcase_comments(id), showcases_images(*)",
    )
    .eq("id", showcase_id)
    .order("display_order", {
      referencedTable: "showcases_images",
      ascending: true,
    })
    .single();

  if (error || !showcase) {
    notFound();
  }

  return <ShowcaseDetail showcase={showcase} user={user} />;
}
