"use server";

import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, validateRequired } from "@/lib/error-handler";
import { revalidateTagSafe } from "@/lib/server-utils";
import { extractPlainText } from "@/lib/tiptap-plain-text";
import { normalizeCategory, normalizeTags } from "@/lib/blog-categories";

const SUMMARY_FALLBACK_LENGTH = 120;

// Tags travel as a JSON array in FormData; anything malformed just means "no tags".
function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return normalizeTags(JSON.parse(raw));
  } catch {
    return [];
  }
}

// Writers may leave the one-liner empty; derive it from the body so cards, search and share previews still have text.
function resolveSummary(summary: string | null, content: string | null): string | null {
  return summary?.trim() || extractPlainText(content, SUMMARY_FALLBACK_LENGTH) || null;
}

export const createBlogPost = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const title = validateRequired(formData.get("title") as string | null, "제목");
    const summary = formData.get("summary") as string | null;
    const content = formData.get("content") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    // slug는 DB 트리거(trig_handle_blog_post_slug)가 title 기반으로 자동 생성
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: user.id,
        title,
        summary: resolveSummary(summary, content),
        content: content ? JSON.parse(content) : null,
        image_url: imageUrl || null,
        category: normalizeCategory(formData.get("category")),
        tags: parseTags(formData.get("tags") as string | null),
      })
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/blog");
    revalidateTagSafe("blog-post-all");
    return createSuccessResponse({ id: data.id, slug: data.slug });
  }
);

export const updateBlogPost = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const id = validateRequired(formData.get("id") as string | null, "글 ID");
    const title = validateRequired(formData.get("title") as string | null, "제목");
    const summary = formData.get("summary") as string | null;
    const content = formData.get("content") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    const { error } = await supabase
      .from("blog_posts")
      .update({
        title,
        summary: resolveSummary(summary, content),
        content: content ? JSON.parse(content) : null,
        image_url: imageUrl || null,
        category: normalizeCategory(formData.get("category")),
        tags: parseTags(formData.get("tags") as string | null),
        // slug은 최초 생성 후 변경하지 않음 (외부 공유 URL 보호)
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidateTagSafe("blog-post-all");
    revalidateTagSafe(`blog-post-${id}`);
    return createSuccessResponse({ id });
  }
);

export const createComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string | null, "댓글");
    const blogPostId = validateRequired(formData.get("blog_post_id") as string | null, "글 ID");
    const parentCommentId = formData.get("parent_comment_id") as string | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase.from("blog_post_comments").insert({
      content: processedContent,
      blog_post_id: blogPostId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error("Error creating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/blog/${blogPostId}`);
    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

export const updateComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string | null, "댓글");
    const commentId = validateRequired(
      formData.get("comment_id") as string,
      "댓글 ID"
    );
    const blogPostId = validateRequired(formData.get("blog_post_id") as string | null, "글 ID");

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase
      .from("blog_post_comments")
      .update({ content: processedContent })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/blog/${blogPostId}`);
    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

export const deleteComment = withAuth(
  async ({ supabase, user }, commentId: string, blogPostId: string) => {
    const { error } = await supabase
      .from("blog_post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/blog/${blogPostId}`);
    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

export const toggleCommentLike = withAuth(
  async ({ supabase, user }, commentId: string, blogPostId: string, hasLiked: boolean) => {
    if (hasLiked) {
      const { error } = await supabase
        .from("blog_post_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (error) throw new Error(`좋아요 취소 실패: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("blog_post_comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
      if (error) throw new Error(`좋아요 실패: ${error.message}`);
    }

    revalidatePath(`/blog/${blogPostId}`);
    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

export const toggleBlogPostLike = withAuth(
  async ({ supabase, user }, blogPostId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      const { error } = await supabase
        .from("blog_post_likes")
        .delete()
        .eq("blog_post_id", blogPostId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("blog_post_likes")
        .insert({ blog_post_id: blogPostId, user_id: user.id });
      if (error) throw new Error(error.message);
    }

    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

export const toggleBlogPostBookmark = withAuth(
  async ({ supabase, user }, blogPostId: string, currentlyBookmarked: boolean) => {
    if (currentlyBookmarked) {
      const { error } = await supabase
        .from("blog_post_bookmarks")
        .delete()
        .eq("blog_post_id", blogPostId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("blog_post_bookmarks")
        .insert({ blog_post_id: blogPostId, user_id: user.id });
      if (error) throw new Error(error.message);
    }

    revalidateTagSafe(`blog-post-${blogPostId}`);
    return createSuccessResponse(null);
  }
);

// Deletes the post and revalidates its caches in one authenticated action.
// This used to be split into a client-side `deleteBlogPost` DB call (relying on
// RLS for authorization) plus a separately-exported `revalidateBlogPostAction`
// that had no auth check at all — since it's referenced from a client component,
// its action ID ships in the public JS bundle, so anyone who found that ID could
// call it directly (POST with a Next-Action header) with an arbitrary post id and
// repeatedly force `blog-post-all` to invalidate, busting every blog detail
// page's cache on demand. Folding delete + revalidate into one `withAuth` action
// that only proceeds if the row it just deleted actually belonged to the caller
// closes that hole.
export const deleteBlogPostAction = withAuth(
  async ({ supabase, user }, blogPostId: string) => {
    const { error, count } = await supabase
      .from("blog_posts")
      .delete({ count: "exact" })
      .eq("id", blogPostId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    if (!count) throw new Error("삭제할 글을 찾을 수 없어요.");

    revalidatePath("/blog");
    revalidateTagSafe("blog-post-all");
    revalidateTagSafe(`blog-post-${blogPostId}`);

    return createSuccessResponse(null);
  }
);

export async function incrementBlogPostViews(blogPostId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_blog_post_views", { p_blog_post_id: blogPostId });
  if (error) {
    console.error("Error incrementing blog post views:", error);
  }
}
