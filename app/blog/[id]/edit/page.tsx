import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BlogEditForm from "@/components/blog/blog-edit-form";

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: insight, error } = await supabase
        .from("insights")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !insight) {
        console.error("Error fetching insight for edit:", error);
        notFound();
    }

    const { data: { user } } = await supabase.auth.getUser();
    const isAuthor = user?.id === insight.user_id;

    if (!isAuthor) {
        // Prevent editing if the user is not the author
        notFound();
    }

    return (
        <div className="bg-white min-h-screen">
            <BlogEditForm initialData={insight} />
        </div>
    );
}
