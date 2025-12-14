import { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client"; // Keep for types if implicitly needed, or remove if unused. Types don't use it.
// Actually, types don't rely on the client import.

type ShowcaseRow = Database["public"]["Tables"]["showcases"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface OptimizedShowcase extends ShowcaseRow {
  profiles: ProfileRow | null;
  showcase_likes: Array<{ user_id: string }>;
  showcase_bookmarks: Array<{ user_id: string }>;
  showcase_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
}

export interface ShowcaseQueryOptions {
  currentUserId: string | null;
  currentPage: number;
  showcasesPerPage: number;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
}

export interface ShowcaseQueryResult {
  showcases: OptimizedShowcase[];
  count: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
}

// Client-side implementation has been moved to Server Action: @/app/showcase/showcase-data-actions.ts
// This file now serves as a Type Definition file for Showcase data structures.
