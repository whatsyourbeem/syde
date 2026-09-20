import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BlogEditForm from "@/components/blog/blog-edit-form";

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: blogPost, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !blogPost) {
        console.error("Error fetching blog post for edit:", error);
        notFound();
    }

    const { data: { user } } = await supabase.auth.getUser();
    const isAuthor = user?.id === blogPost.user_id;

    if (!isAuthor) {
        // Prevent editing if the user is not the author
        notFound();
    }

    return (
        <div className="bg-white min-h-screen">
            <BlogEditForm initialData={blogPost} />
        </div>
    );
}
