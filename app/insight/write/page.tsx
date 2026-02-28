"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import {
    Plus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import { JSONContent } from "@tiptap/react";

const TiptapEditorWrapper = dynamic(
    () => import("@/components/common/tiptap-editor-wrapper"),
    {
        loading: () => (
            <div className="h-64 bg-gray-50 animate-pulse rounded-[10px] flex items-center justify-center border border-[#B7B7B7] text-gray-400">
                에디터 로딩 중...
            </div>
        ),
        ssr: false,
    }
);

function InsightWriteForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState<JSONContent | null>(null);
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        if (isEditMode && id) {
            async function fetchInsight() {
                try {
                    const { data, error } = await supabase
                        .from("insights")
                        .select("*")
                        .eq("id", id as string)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setTitle(data.title);
                        setSummary(data.summary || "");
                        setImageUrl(data.image_url || "");

                        if (data.content && typeof data.content === 'object' && !Array.isArray(data.content) && 'type' in data.content) {
                            setContent(data.content as JSONContent);
                        } else if (typeof data.content === 'string') {
                            try {
                                setContent(JSON.parse(data.content) as JSONContent);
                            } catch {
                                setContent({
                                    type: "doc",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: data.content,
                                                },
                                            ],
                                        },
                                    ],
                                });
                            }
                        } else {
                            setContent(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching insight for edit:", error);
                    toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
                } finally {
                    setFetching(false);
                }
            }
            fetchInsight();
        }
    }, [id, isEditMode, supabase]);

    const handleSubmit = async () => {
        if (!title || !summary || !content) {
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

            if (isEditMode) {
                const { error } = await supabase
                    .from("insights")
                    .update({
                        title,
                        summary,
                        content: JSON.stringify(content),
                        image_url: imageUrl || null
                    })
                    .eq("id", id as string)
                    .eq("user_id", user.id);

                if (error) throw error;
                toast.success("인사이트가 수정되었습니다!");
                router.push(`/insight/${id}`);
            } else {
                const { data, error } = await supabase
                    .from("insights")
                    .insert([
                        {
                            user_id: user.id,
                            title,
                            summary,
                            content: JSON.stringify(content),
                            image_url: imageUrl || null
                        }
                    ])
                    .select()
                    .single();

                if (error) throw error;

                toast.success("인사이트가 등록되었습니다!");
                router.push(`/insight/${data.id}`);
            }
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(`${isEditMode ? '수정' : '등록'} 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | File[] } }): Promise<string | null> => {
        const file = e.target.files?.[0];
        if (!file) return null;

        // 용량 제한 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("이미지 크기는 5MB를 초과할 수 없습니다.");
            return null;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("로그인이 필요합니다.");
                return null;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('insight-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('insight-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(`이미지 업로드 실패: ${err.message}`);
            return null;
        } finally {
            setUploading(false);
            return null;
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002040]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white max-w-[393px] mx-auto font-[Pretendard]">
            {/* Page Title Section */}
            <section className="w-full flex flex-col items-center py-5 px-4 gap-4">
                <h1 className="text-[24px] font-bold leading-[29px] text-[#002040] text-center w-full">
                    SYDE 인사이트 {isEditMode ? '수정하기' : '등록하기'}
                </h1>
            </section>

            {/* Main Inputs Area */}
            <main className="flex-grow flex flex-col p-5 gap-5 pb-10">
                {/* Title Input */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040] flex items-center gap-0.5">
                        인사이트 제목 <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full h-9 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040]">
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
                    <label className="text-[14px] font-medium text-[#002040] flex items-center gap-0.5">
                        한 줄 소개 <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full h-9 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040]">
                        <input
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="SYDE 인사이트를 한 줄로 표현해주세요."
                            className="w-full h-full bg-transparent px-3 text-[14px] outline-none placeholder:text-[#777777]"
                        />
                    </div>
                </div>

                {/* Representative Image UI */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040]">대표 이미지</label>
                    <div className="w-full h-[180px] border-[0.5px] border-[#B7B7B7] rounded-[10px] flex items-center justify-between p-0 overflow-hidden bg-gray-50/30">
                        <div className="flex flex-col justify-center items-center flex-1 px-4 gap-5">
                            <p className="text-[12px] leading-[14px] text-[#777777] text-center">
                                인사이트를 잘 표현하는<br />대표 이미지를 설정해주세요.
                            </p>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        handleFileChange(e).then((url) => {
                                            if (url) setImageUrl(url);
                                        });
                                    }}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Button
                                    className="w-20 h-8 bg-[#002040] hover:bg-[#003060] text-white text-[14px] rounded-[12px] font-normal"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "설정"}
                                </Button>
                                {imageUrl && (
                                    <button
                                        onClick={() => setImageUrl("")}
                                        className="text-[10px] text-red-400 hover:underline"
                                    >
                                        이미지 삭제
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="w-[180px] h-full bg-[#222E35] flex items-center justify-center relative">
                            {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="relative text-white flex flex-col items-center transform scale-75">
                                    <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg] shadow-lg">
                                        <div className="w-16 h-16 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
                                            <div className="flex gap-4 mt-2">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <div className="w-8 h-4 border-b-2 border-white rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                </div>
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
                    <label className="text-[14px] font-medium text-[#002040]">내용 <span className="text-red-500">*</span></label>
                    <div className="w-full min-h-[400px] border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040] overflow-hidden">
                        <TiptapEditorWrapper
                            initialContent={content}
                            onContentChange={setContent}
                            placeholder="인사이트 내용을 자유롭게 작성해주세요."
                            editable={true}
                            onImageUpload={async (file) => {
                                // 기존의 업로드 로직 활용 (Tiptap 내 이미지 업로드용)
                                // Event를 가짜로 만들어서 handleFileChange에 넘기거나 직접 업로드
                                const simulatedEvent = {
                                    target: { files: [file] }
                                };
                                const publicUrl = await handleFileChange(simulatedEvent);
                                return publicUrl;
                            }}
                        />
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="flex flex-row gap-2.5 w-full mt-2">
                    <Button
                        variant="outline"
                        className="w-[53px] h-9 border-[#002040] text-[#002040] rounded-[12px] text-[14px] hover:bg-gray-50"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button
                        className="flex-grow h-9 bg-[#002040] hover:bg-[#003060] text-white rounded-[12px] text-[14px] font-medium"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "처리 중..." : `인사이트 ${isEditMode ? '수정하기' : '등록하기'}`}
                    </Button>
                </div>
            </main>
        </div>
    );
}

export default function InsightWritePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002040]"></div></div>}>
            <InsightWriteForm />
        </Suspense>
    );
}
