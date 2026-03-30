import React, { Suspense } from "react";
import InsightEditForm from "@/components/insight/insight-edit-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InsightWritePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/insight");
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sydeblue"></div></div>}>
            <InsightEditForm />
        </Suspense>
    );
}
