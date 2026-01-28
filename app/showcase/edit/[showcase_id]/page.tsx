import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectRegistrationForm } from "@/components/showcase/project-registration-form";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";

export default async function ShowcaseEditPage({
  params,
}: {
  params: Promise<{ showcase_id: string }>;
}) {
  const { showcase_id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: showcase, error } = await supabase
    .from("showcases")
    .select(
      `
      *,
      profiles:user_id (*),
      showcase_likes(user_id),
      showcase_bookmarks(user_id),
      showcase_comments(id),
      showcases_images(*),
      showcases_links(*),
      members:showcases_members(*, profile:profiles(*))
    `,
    )
    .eq("id", showcase_id)
    .single();

  if (error || !showcase) {
    console.error("Error fetching showcase for edit:", error);
    notFound();
  }

  // Permission Check
  if (showcase.user_id !== user.id) {
    redirect(`/showcase/${showcase_id}`);
  }

  // Data Transformation to match OptimizedShowcase (similar to Detail Page)
  const showcaseData = showcase as any;

  // Sort members and images
  const members = (showcaseData.members || [])
    .map((m: any) => ({
      ...m,
      profile: m.profile, // Ensure profile is attached
    }))
    .sort((a: any, b: any) => a.display_order - b.display_order);

  const images = (showcaseData.showcases_images || []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  );

  const initialData: OptimizedShowcase = {
    ...showcaseData,
    members: members,
    showcases_images: images,
    // Add missing calculated fields required by OptimizedShowcase (though form might not use them all)
    likesCount: showcaseData.showcase_likes?.length || 0,
    hasLiked: showcaseData.showcase_likes?.some(
      (l: any) => l.user_id === user.id,
    ),
    bookmarksCount: showcaseData.showcase_bookmarks?.length || 0,
    hasBookmarked: showcaseData.showcase_bookmarks?.some(
      (b: any) => b.user_id === user.id,
    ),
    showcase_comments: showcaseData.showcase_comments || [],
  };

  return (
    <div className="container mx-auto py-10">
      <ProjectRegistrationForm initialData={initialData} />
    </div>
  );
}
