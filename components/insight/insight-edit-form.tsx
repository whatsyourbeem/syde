"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import { JSONContent } from "@tiptap/react";
import { compressImage, FILE_SIZE_LIMIT } from "@/lib/image-compression";

const TiptapEditorWrapper = dynamic(
    () => import("@/components/common/tiptap-editor-wrapper"),
    {
        loading: () => (
            <div className="h-32 bg-gray-50 animate-pulse rounded-md flex items-center justify-center text-sm text-gray-400">
                에디터 로딩 중...
            </div>
        ),
        ssr: false,
    }
);

interface InsightEditFormProps {
    initialData?: {
        id: string;
        title: string;
        summary: string | null;
        content: JSONContent | string;
        image_url: string | null;
        user_id: string;
    } | null;
}

export default function InsightEditForm({ initialData }: InsightEditFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditMode = !!initialData;

    // Parse string content to JSON object if needed
    const getInitialContent = () => {
        if (!initialData?.content) return "";
        if (typeof initialData.content === 'string') {
            try {
                return JSON.parse(initialData.content);
            } catch {
                return initialData.content;
            }
        }
        return initialData.content;
    };

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState(initialData?.title || "");
    const [summary, setSummary] = useState(initialData?.summary || "");
    const [content, setContent] = useState<JSONContent | string>(getInitialContent());
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");

    const handleSubmit = async () => {
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        if (!title || !summary || !contentString || contentString === '{"type":"doc","content":[]}') {
            toast.error("필수 항목을 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("로그인이 필요합니다.");
                return;
            }

            if (isEditMode && initialData) {
                // Determine if we need to call a server action or update directly via supabase client.
                // Looking at the app/meetup/[meetup_id]/edit/page.tsx, the meetup-edit-form uses a Server Action (`updateMeetup`). 
                // BUT the previous `app/insight/write/page.tsx` was using direct supabase client calls. 
                // To keep it simple and consistent with what worked, we will stick to the supabase client calls here for now.
                const { error } = await supabase
                    .from("insights")
                    .update({
                        title,
                        summary,
                        content: contentString,
                        image_url: imageUrl || null
                    })
                    .eq("id", initialData.id)
                    .eq("user_id", user.id);

                if (error) throw error;
                toast.success("인사이트가 수정되었습니다!");

                // Optional: To refresh data since we edited it, calling router.refresh() 
                router.refresh();
                router.push(`/insight/${initialData.id}`);
            } else {
                const { data, error } = await supabase
                    .from("insights")
                    .insert([
                        {
                            user_id: user.id,
                            title,
                            summary,
                            content: contentString,
                            image_url: imageUrl || null
                        }
                    ])
                    .select()
                    .single();

                if (error) throw error;

                toast.success("인사이트가 등록되었습니다!");
                router.push(`/insight/${data.id}`);
            }
        } catch (error) {
            console.error("Error submitting insight:", error);
            const errMsg = error instanceof Error ? error.message : "알 수 없는 오류";
            toast.error(`${isEditMode ? '수정' : '등록'} 실패: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTiptapImageUpload = async (file: File): Promise<string | null> => {
        try {
            if (file.size > FILE_SIZE_LIMIT) {
                throw new Error(`이미지 용량은 20MB를 초과할 수 없습니다.`);
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            const compressed = await compressImage(file, "detail");
            const filePath = `${user.id}/editor/${uuidv4()}`;

            const { error: uploadError } = await supabase.storage
                .from('insight-images')
                .upload(filePath, compressed);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('insight-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error("Error uploading tiptap image:", error);
            throw error;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > FILE_SIZE_LIMIT) {
            toast.error(`이미지는 20MB를 초과할 수 없습니다.`);
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("로그인이 필요합니다.");
                return;
            }

            const compressed = await compressImage(file, "thumbnail");
            const filePath = `${user.id}/${uuidv4()}`;

            const { error: uploadError } = await supabase.storage
                .from('insight-images')
                .upload(filePath, compressed);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('insight-images')
                .getPublicUrl(filePath);

            setImageUrl(publicUrl);
            toast.success("이미지가 업로드되었습니다.");
        } catch (error) {
            console.error("Error uploading image:", error);
            const errMsg = error instanceof Error ? error.message : "알 수 없는 오류";
            toast.error(`이미지 업로드 실패: ${errMsg}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col bg-white w-full max-w-6xl mx-auto font-[Pretendard] px-4 md:px-6">
            {/* Page Title Section */}
            <section className="w-full flex flex-col items-center py-5 gap-4">
                <h1 className="text-[24px] font-bold leading-[29px] text-sydeblue text-center w-full md:text-left md:py-4">
                    SYDE 인사이트 {isEditMode ? '수정하기' : '등록하기'}
                </h1>
            </section>

            {/* Main Inputs Area */}
            <main className="flex-grow flex flex-col gap-5 pb-10">
                {/* Title & Summary */}
                <div className="flex flex-col gap-5">
                    {/* Title Input */}
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-[14px] font-medium text-sydeblue flex items-center gap-0.5">
                            인사이트 제목 <span className="text-red-500">*</span>
                        </label>
                        <div className="w-full h-11 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[sydeblue]">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="SYDE 인사이트 제목을 적어주세요."
                                className="w-full h-full bg-transparent px-3 text-[14px] outline-none placeholder:text-[#777777]"
                            />
                        </div>
                    </div>

                    {/* Tagline/Summary Input */}
                    <div className="flex flex-col gap-1 w-full">
                        <label className="text-[14px] font-medium text-sydeblue flex items-center gap-0.5">
                            한 줄 소개 <span className="text-red-500">*</span>
                        </label>
                        <div className="w-full h-11 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[sydeblue]">
                            <input
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="SYDE 인사이트를 한 줄로 표현해주세요."
                                className="w-full h-full bg-transparent px-3 text-[14px] outline-none placeholder:text-[#777777]"
                            />
                        </div>
                    </div>
                </div>

                {/* Representative Image UI */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-sydeblue">대표 이미지</label>
                    <div className="w-full h-[180px] md:h-[240px] border-[0.5px] border-[#B7B7B7] rounded-[10px] flex flex-row items-center justify-between p-0 overflow-hidden bg-gray-50/30">
                        <div className="flex flex-col justify-center items-start flex-1 p-6 md:p-10 gap-5">
                            <p className="text-[12px] md:text-[16px] leading-[1.5] text-[#777777] text-left">
                                인사이트를 잘 표현하는<br />대표 이미지를 설정해주세요.
                            </p>
                            <div className="flex flex-col gap-2 items-start">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Button
                                    className="w-20 md:w-24 h-8 md:h-10 bg-sydeblue hover:bg-sydeblue/90 text-white text-[14px] rounded-[12px] font-normal"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "이미지 설정"}
                                </Button>
                                {imageUrl && (
                                    <button
                                        onClick={() => setImageUrl("")}
                                        className="text-[10px] md:text-[12px] text-red-400 hover:underline"
                                    >
                                        이미지 삭제
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="w-[180px] md:w-[400px] h-full bg-[#222E35] flex items-center justify-center relative flex-shrink-0">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <img src="/we-are-syders.png" alt="We are SYDERS" className="w-full h-full object-cover opacity-50" />
                            )}
                            {!imageUrl && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Plus className="w-10 h-10 text-white/20" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-sydeblue">내용 <span className="text-red-500">*</span></label>
                    <div className="w-full min-h-[500px] border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-sydeblue overflow-hidden">
                        <TiptapEditorWrapper
                            initialContent={typeof content === 'string' ? null : content}
                            onContentChange={(json) => setContent(json)}
                            placeholder="인사이트 내용을 입력해주세요."
                            onImageUpload={handleTiptapImageUpload}
                        />
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="flex flex-row justify-end gap-2.5 w-full mt-2">
                    <Button
                        variant="outline"
                        className="w-24 h-10 border-sydeblue text-sydeblue rounded-[12px] text-[14px] hover:bg-gray-50"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button
                        className="w-48 h-10 bg-sydeblue hover:bg-sydeblue/90 text-white rounded-[12px] text-[14px] font-medium"
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                    >
                        {uploading ? "업로드 중..." : loading ? "처리 중..." : `인사이트 ${isEditMode ? '수정하기' : '등록하기'}`}
                    </Button>
                </div>
            </main>
        </div>
    );
}
