"use client";

import React, { Suspense } from "react";
import InsightEditForm from "@/components/insight/insight-edit-form";

export default function InsightWritePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002040]"></div></div>}>
            <InsightEditForm />
        </Suspense>
    );
}
