"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useLocalDraft } from "@/hooks/use-local-draft";
import { cn } from "@/lib/utils";
import { InsightWriteBar } from "@/components/insight/insight-write-bar";
import dynamic from "next/dynamic";
import { JSONContent } from "@tiptap/react";
import { createInsight, updateInsight } from "@/app/insight/insight-actions";
import { useQueryClient } from "@tanstack/react-query";

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

interface DraftData {
    title: string;
    summary: string;
    content: JSONContent | string;
    imageUrl: string;
}

// The editor normalizes documents on load (adds null attrs, a trailing empty paragraph),
// so compare drafts on a form that ignores those no-op differences.
function normalizeNode(node: JSONContent): JSONContent {
    const attrs = node.attrs
        ? Object.fromEntries(Object.entries(node.attrs).filter(([, value]) => value !== null && value !== undefined))
        : undefined;
    return {
        ...node,
        attrs: attrs && Object.keys(attrs).length > 0 ? attrs : undefined,
        content: node.content?.map(normalizeNode),
    };
}

function draftSignature({ title, summary, content, imageUrl }: DraftData): string {
    let body: JSONContent[] | string;
    if (typeof content === "string") {
        body = content.trim() || [];
    } else {
        body = normalizeNode(content).content ?? [];
        while (body.length > 0 && body[body.length - 1].type === "paragraph" && !body[body.length - 1].content?.length) {
            body = body.slice(0, -1);
        }
    }
    return JSON.stringify([title.trim(), summary.trim(), imageUrl, body]);
}

const EMPTY_DRAFT_SIGNATURE = draftSignature({ title: "", summary: "", content: "", imageUrl: "" });

type FieldErrors = Partial<Record<"title" | "body" | "summary", string>>;
// Matches the on-screen order so validation jumps to the topmost problem.
const FIELD_ORDER = ["title", "body", "summary"] as const;
const NON_TEXT_CONTENT_NODES = new Set(["imageResize", "linkPreview", "horizontalRule"]);

// A doc with only empty paragraphs (e.g. typed then deleted) is still empty.
function isBodyEmpty(content: JSONContent | string): boolean {
    if (typeof content === "string") return !content.trim();
    const hasContent = (node: JSONContent): boolean =>
        (node.type !== undefined && NON_TEXT_CONTENT_NODES.has(node.type)) ||
        !!node.text?.trim() ||
        (node.content ?? []).some(hasContent);
    return !hasContent(content);
}

interface InsightEditFormProps {
    initialData?: {
        id: string;
        title: string;
        summary: string | null;
        content: JSONContent | string;
        image_url: string | null;
        user_id: string;
        slug: string | null;
    } | null;
}

export default function InsightEditForm({ initialData }: InsightEditFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
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
    const { isUploading: uploading, uploadImage } = useImageUpload();
    const [title, setTitle] = useState(initialData?.title || "");
    const [summary, setSummary] = useState(initialData?.summary || "");
    const [content, setContent] = useState<JSONContent | string>(getInitialContent());
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
    const [errors, setErrors] = useState<FieldErrors>({});
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const summaryRef = useRef<HTMLInputElement>(null);
    const fieldRefs = { title: titleRef, body: bodyRef, summary: summaryRef };
    // Grow the title textarea with its content, including programmatic changes like draft restore.
    useEffect(() => {
        const el = titleRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [title]);
    const clearError = (field: keyof FieldErrors) =>
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

    const draftData = useMemo(() => ({ title, summary, content, imageUrl }), [title, summary, content, imageUrl]);
    const [initialSnapshot] = useState(() => draftSignature(draftData));
    const {
        pendingDraft,
        restore: restoreDraft,
        discard: discardDraft,
        clear: clearDraft,
        lastSavedAt,
    } = useLocalDraft({
        key: `syde:insight-draft:${initialData?.id ?? "new"}`,
        data: draftData,
        isPristine: (data) => {
            const signature = draftSignature(data);
            return signature === initialSnapshot || signature === EMPTY_DRAFT_SIGNATURE;
        },
    });

    const handleRestoreDraft = () => {
        const draft = restoreDraft();
        if (!draft) return;
        setTitle(draft.title);
        setSummary(draft.summary);
        setContent(draft.content);
        setImageUrl(draft.imageUrl);
    };

    // Writers often arrive from a shared link (e.g. a DM); "back" would leave the site, so fall back to the list.
    const handleExit = () => {
        if (window.history.length > 1) router.back();
        else router.push("/insight");
    };

    const handleSubmit = async () => {
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        const nextErrors: FieldErrors = {};
        if (!title.trim()) nextErrors.title = "제목을 입력해주세요.";
        if (isBodyEmpty(content)) nextErrors.body = "본문을 입력해주세요.";
        if (!summary.trim()) nextErrors.summary = "한 줄 소개를 입력해주세요.";
        setErrors(nextErrors);

        const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
        if (firstInvalid) {
            toast.error(nextErrors[firstInvalid]);
            const target = fieldRefs[firstInvalid].current;
            target?.scrollIntoView({ block: "center", behavior: "smooth" });
            const focusable = firstInvalid === "body" ? target?.querySelector<HTMLElement>(".ProseMirror") : target;
            focusable?.focus({ preventScroll: true });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("summary", summary);
        formData.append("content", contentString);
        formData.append("imageUrl", imageUrl || "");

        try {
            if (isEditMode && initialData) {
                formData.append("id", initialData.id);
                const result = await updateInsight(formData);
                if (!result.success) {
                    toast.error(`수정 실패: ${result.error.message}`);
                } else {
                    clearDraft();
                    queryClient.invalidateQueries({ queryKey: ["insights"] });
                    toast.success("인사이트가 수정되었습니다!");
                    router.push(`/insight/${initialData.slug || initialData.id}`);
                }
            } else {
                const result = await createInsight(formData);
                if (!result.success) {
                    toast.error(`등록 실패: ${result.error.message}`);
                } else {
                    clearDraft();
                    queryClient.invalidateQueries({ queryKey: ["insights"] });
                    toast.success("인사이트가 등록되었습니다!");
                    router.push(`/insight/${result.data.slug || result.data.id}`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTiptapImageUpload = async (file: File): Promise<string | null> => {
        const publicUrl = await uploadImage(file, "insight-images", "editor", "detail");
        if (!publicUrl) throw new Error("이미지 업로드에 실패했습니다.");
        return publicUrl;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, "insight-images", "", "detail");
        if (publicUrl) {
            setImageUrl(publicUrl);
            toast.success("이미지가 업로드되었습니다.");
        }
    };

    return (
        <div className="flex flex-col bg-white w-full max-w-3xl mx-auto font-[Pretendard] px-4 md:px-6">
            <InsightWriteBar
                pageLabel={isEditMode ? "인사이트 수정" : "인사이트 등록"}
                lastSavedAt={lastSavedAt}
                onExit={handleExit}
                onPublish={handleSubmit}
                publishLabel={isEditMode ? "수정하기" : "등록하기"}
                busyLabel={uploading ? "업로드 중" : loading ? "처리 중" : null}
            />
            <div className="h-6 md:h-8" />

            {pendingDraft && (
                <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-sydeblue/20 bg-sydeblue/5 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-2 text-[14px] text-sydeblue">
                        <FileClock className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            작성 중이던 글이 있어요
                            <span className="text-[#777777]">
                                {" "}· {formatDistanceToNow(pendingDraft.savedAt, { addSuffix: true, locale: ko })} 저장
                                {pendingDraft.data.title && ` · "${pendingDraft.data.title}"`}
                            </span>
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2 self-end md:self-auto">
                        <Button variant="ghost" size="sm" className="text-[#777777]" onClick={discardDraft}>
                            버리기
                        </Button>
                        <Button size="sm" className="bg-sydeblue hover:bg-sydeblue/90 text-white" onClick={handleRestoreDraft}>
                            이어서 쓰기
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Inputs Area */}
            <main className="flex-grow flex flex-col gap-5 pb-10">
                {/* Title: a writing surface, not a form field */}
                <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="insight-title" className="sr-only">제목 (필수)</label>
                    <textarea
                        id="insight-title"
                        ref={titleRef}
                        rows={1}
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value.replace(/\n/g, " "));
                            clearError("title");
                        }}
                        onKeyDown={(e) => {
                            // Titles are one line; Enter moves on to the body like most blog editors.
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                bodyRef.current?.querySelector<HTMLElement>(".ProseMirror")?.focus();
                            }
                        }}
                        aria-invalid={!!errors.title}
                        aria-required
                        placeholder="제목을 입력하세요"
                        className={cn(
                            "w-full resize-none overflow-hidden bg-transparent border-b-2 border-transparent pb-2 text-[30px] md:text-[40px] font-bold leading-tight text-foreground outline-none placeholder:text-[#C4C4C4] transition-colors focus:border-[#E5E5E5]",
                            errors.title && "border-red-500 focus:border-red-500",
                        )}
                    />
                    {errors.title && <p className="text-[12px] text-red-500">{errors.title}</p>}
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="sr-only">본문 (필수)</label>
                    <div
                        ref={bodyRef}
                        className={cn(
                            // Edge-to-edge on mobile so the page and editor paddings don't stack up.
                            "-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full min-h-[500px] border-y-[0.5px] md:border-[0.5px] border-[#B7B7B7] md:rounded-[10px] relative transition-all md:focus-within:ring-1 md:focus-within:ring-sydeblue overflow-clip",
                            errors.body && "border-red-500 ring-1 ring-red-500",
                        )}
                    >
                        <TiptapEditorWrapper
                            initialContent={typeof content === 'string' ? null : content}
                            onContentChange={(json) => {
                                setContent(json);
                                clearError("body");
                            }}
                            placeholder="인사이트 내용을 입력해주세요."
                            onImageUpload={handleTiptapImageUpload}
                        />
                    </div>
                    {errors.body && <p className="text-[12px] text-red-500">{errors.body}</p>}
                </div>

                {/* Publish details: needed for the card, but not what the writer came here to do */}
                <section className="flex flex-col gap-5 border-t border-[#E5E5E5] pt-6">
                    <h2 className="text-[16px] font-bold text-sydeblue">발행 정보</h2>

                    <div className="flex flex-col gap-1 w-full">
                        <label htmlFor="insight-summary" className="text-[14px] font-medium text-sydeblue flex items-center gap-0.5">
                            한 줄 소개 <span className="text-red-500">*</span>
                        </label>
                        <div className={cn(
                            "w-full h-11 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-sydeblue",
                            errors.summary && "border-red-500 ring-1 ring-red-500",
                        )}>
                            <input
                                id="insight-summary"
                                ref={summaryRef}
                                value={summary}
                                onChange={(e) => {
                                    setSummary(e.target.value);
                                    clearError("summary");
                                }}
                                aria-invalid={!!errors.summary}
                                placeholder="SYDE 인사이트를 한 줄로 표현해주세요."
                                className="w-full h-full bg-transparent px-3 text-[16px] md:text-[14px] outline-none placeholder:text-[#777777]"
                            />
                        </div>
                        {errors.summary
                            ? <p className="text-[12px] text-red-500">{errors.summary}</p>
                            : <p className="text-[12px] text-[#999999]">목록 카드에 제목과 함께 보여요.</p>}
                    </div>

                {/* Representative Image UI */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-sydeblue">대표 이미지 <span className="font-normal text-[#999999]">(선택)</span></label>
                    <div className="w-full h-[120px] md:h-[160px] border-[0.5px] border-[#B7B7B7] rounded-[10px] flex flex-row items-center justify-between p-0 overflow-hidden bg-gray-50/30">
                        <div className="flex flex-col justify-center items-start flex-1 p-4 md:p-8 gap-3">
                            <p className="text-[12px] md:text-[14px] leading-[1.5] text-[#777777] text-left">
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

                        <div className="w-[120px] md:w-[280px] h-full bg-[#222E35] flex items-center justify-center relative flex-shrink-0">
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
                </section>

                {/* Buttons Section */}
                <div className="flex flex-row justify-end items-center gap-2.5 w-full mt-2">
                    <Button
                        variant="outline"
                        className="w-24 h-10 border-sydeblue text-sydeblue rounded-[12px] text-[14px] hover:bg-gray-50"
                        onClick={handleExit}
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
