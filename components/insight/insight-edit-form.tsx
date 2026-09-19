"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useLocalDraft } from "@/hooks/use-local-draft";
import { cn } from "@/lib/utils";
import { EditorWriteBar } from "@/components/common/editor-write-bar";
import { DraftRestoreBanner } from "@/components/common/draft-restore-banner";
import { normalizeTiptapContent } from "@/lib/tiptap-content-signature";
import { isTiptapContentEmpty } from "@/lib/tiptap-content";
import { extractPlainText } from "@/lib/tiptap-plain-text";
import { normalizeCategory, normalizeTags, type InsightCategory } from "@/lib/insight-categories";
import { InsightPublishSheet } from "@/components/insight/insight-publish-sheet";
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

// Pulls in the server HTML renderer (syntax highlighting, etc.); only worth loading once the writer asks to preview.
const EditorPreviewDialog = dynamic(
    () => import("@/components/common/editor-preview-dialog").then((mod) => mod.EditorPreviewDialog),
    { ssr: false },
);

interface DraftData {
    title: string;
    summary: string;
    content: JSONContent | string;
    imageUrl: string;
    category: InsightCategory | null;
    tags: string[];
}

function draftSignature({ title, summary, content, imageUrl, category, tags }: DraftData): string {
    return JSON.stringify([title.trim(), summary.trim(), imageUrl, category, tags, normalizeTiptapContent(content)]);
}

const EMPTY_DRAFT_SIGNATURE = draftSignature({ title: "", summary: "", content: "", imageUrl: "", category: null, tags: [] });

type FieldErrors = Partial<Record<"title" | "body", string>>;
// Matches the on-screen order so validation jumps to the topmost problem.
const FIELD_ORDER = ["title", "body"] as const;

// Same limit the server uses when it fills an empty summary from the body.
const SUMMARY_PREVIEW_LENGTH = 120;

/** Every image in the body, in reading order and without repeats: the cover candidates. */
function collectBodyImages(content: JSONContent | string): string[] {
    if (typeof content === "string") return [];
    const found = new Set<string>();
    const walk = (node: JSONContent) => {
        if (node.type === "imageResize" && typeof node.attrs?.src === "string") found.add(node.attrs.src);
        node.content?.forEach(walk);
    };
    walk(content);
    return [...found];
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
        category?: string | null;
        tags?: string[] | null;
    } | null;
}

export default function InsightEditForm({ initialData }: InsightEditFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
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
    const [category, setCategory] = useState<InsightCategory | null>(normalizeCategory(initialData?.category));
    const [tags, setTags] = useState<string[]>(normalizeTags(initialData?.tags));
    const [errors, setErrors] = useState<FieldErrors>({});
    const [previewOpen, setPreviewOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [stats, setStats] = useState({ characters: 0 });
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const fieldRefs = { title: titleRef, body: bodyRef };
    // Grow the title textarea with its content, including programmatic changes like draft restore.
    useEffect(() => {
        const el = titleRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [title]);
    const clearError = (field: keyof FieldErrors) =>
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

    const imageCandidates = useMemo(() => collectBodyImages(content), [content]);
    const summaryPlaceholder = useMemo(() => extractPlainText(content, SUMMARY_PREVIEW_LENGTH), [content]);

    const draftData = useMemo(
        () => ({ title, summary, content, imageUrl, category, tags }),
        [title, summary, content, imageUrl, category, tags],
    );
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
        // Drafts saved before categories existed have neither field.
        setCategory(normalizeCategory(draft.category));
        setTags(normalizeTags(draft.tags));
    };

    // Writers often arrive from a shared link (e.g. a DM); "back" would leave the site, so fall back to the list.
    const handleExit = () => {
        if (window.history.length > 1) router.back();
        else router.push("/insight");
    };

    // Checks title and body before the publish sheet opens, and jumps to whatever is missing.
    const handleRequestPublish = () => {
        const nextErrors: FieldErrors = {};
        if (!title.trim()) nextErrors.title = "제목을 입력해주세요.";
        if (isTiptapContentEmpty(content)) nextErrors.body = "본문을 입력해주세요.";
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
        setPublishOpen(true);
    };

    const handleSubmit = async () => {
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("summary", summary);
        formData.append("content", contentString);
        formData.append("imageUrl", imageUrl || "");
        formData.append("category", category ?? "");
        formData.append("tags", JSON.stringify(tags));

        try {
            if (isEditMode && initialData) {
                formData.append("id", initialData.id);
                const result = await updateInsight(formData);
                if (!result.success) {
                    toast.error(`수정 실패: ${result.error.message}`);
                } else {
                    clearDraft();
                    queryClient.invalidateQueries({ queryKey: ["insights"] });
                    toast.success("글이 수정됐어요");
                    router.push(`/insight/${initialData.slug || initialData.id}`);
                }
            } else {
                const result = await createInsight(formData);
                if (!result.success) {
                    toast.error(`발행 실패: ${result.error.message}`);
                } else {
                    clearDraft();
                    queryClient.invalidateQueries({ queryKey: ["insights"] });
                    toast.success("글이 발행됐어요");
                    router.push(`/insight/${result.data.slug || result.data.id}`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // uploadImage reports its own failures; resolving null keeps the editor from toasting a second time.
    const handleTiptapImageUpload = (file: File) => uploadImage(file, "insight-images", "editor", "detail");

    const handleCoverUpload = async (file: File) => {
        const publicUrl = await uploadImage(file, "insight-images", "", "detail");
        if (publicUrl) setImageUrl(publicUrl);
    };

    return (
        <div className="flex flex-col bg-white w-full max-w-3xl mx-auto font-[Pretendard] px-4 md:px-6">
            <EditorWriteBar
                pageLabel={isEditMode ? "글 수정" : "글쓰기"}
                lastSavedAt={lastSavedAt}
                onExit={handleExit}
                onPreview={() => setPreviewOpen(true)}
                onPublish={handleRequestPublish}
                publishLabel={isEditMode ? "수정하기" : "발행하기"}
                busyLabel={uploading ? "업로드 중" : loading ? "처리 중" : null}
                stats={stats}
                bleedClassName="-mx-4 md:-mx-6"
            />
            {previewOpen && (
                <EditorPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={title}
                    subtitle={summary.trim() || summaryPlaceholder}
                    imageUrl={imageUrl}
                    content={content}
                />
            )}
            <InsightPublishSheet
                open={publishOpen}
                onOpenChange={setPublishOpen}
                isEditMode={isEditMode}
                imageCandidates={imageCandidates}
                imageUrl={imageUrl}
                onImageUrlChange={setImageUrl}
                onUploadImage={handleCoverUpload}
                uploading={uploading}
                category={category}
                onCategoryChange={setCategory}
                tags={tags}
                onTagsChange={setTags}
                summary={summary}
                onSummaryChange={setSummary}
                summaryPlaceholder={summaryPlaceholder}
                submitting={loading}
                onConfirm={handleSubmit}
            />
            <div className="h-6 md:h-8" />

            {pendingDraft && (
                <DraftRestoreBanner
                    savedAt={pendingDraft.savedAt}
                    preview={pendingDraft.data.title}
                    onDiscard={discardDraft}
                    onRestore={handleRestoreDraft}
                />
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

                {/* Content Area: no frame, so the page itself reads as the writing surface */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="sr-only">본문 (필수)</label>
                    <div
                        ref={bodyRef}
                        className={cn("relative min-h-[500px]", errors.body && "rounded-[10px] ring-1 ring-red-500")}
                    >
                        <TiptapEditorWrapper
                            variant="document"
                            initialContent={typeof content === 'string' ? null : content}
                            onContentChange={(json) => {
                                setContent(json);
                                clearError("body");
                            }}
                            placeholder="오늘 어떤 일이 있었나요? 편하게 적어보세요."
                            onImageUpload={handleTiptapImageUpload}
                            onStatsChange={setStats}
                            onBackspaceAtStart={() => {
                                const el = titleRef.current;
                                if (!el) return;
                                el.focus();
                                el.setSelectionRange(el.value.length, el.value.length);
                            }}
                        />
                    </div>
                    {errors.body && <p className="text-[12px] text-red-500">{errors.body}</p>}
                </div>
            </main>
        </div>
    );
}
