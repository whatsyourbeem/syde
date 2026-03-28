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
      showcase_upvotes(user_id),
      showcase_comments(id),
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

  const images = (showcaseData.images || []);

  const initialData: OptimizedShowcase = {
    ...showcaseData,
    members: members,
    images: images,
    // Add missing calculated fields required by OptimizedShowcase (though form might not use them all)
    upvotesCount: showcaseData.showcase_upvotes?.length || 0,
    hasUpvoted: showcaseData.showcase_upvotes?.some(
      (l: any) => l.user_id === user.id,
    ),
    showcase_comments: showcaseData.showcase_comments || [],
  };

  return (
    <div className="container mx-auto py-10">
      <ProjectRegistrationForm initialData={initialData} />
    </div>
  );
}
