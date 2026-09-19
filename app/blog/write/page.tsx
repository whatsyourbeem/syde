import React, { Suspense } from "react";
import BlogEditForm from "@/components/blog/blog-edit-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BlogWritePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/blog");
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sydeblue"></div></div>}>
            <BlogEditForm />
        </Suspense>
    );
}
