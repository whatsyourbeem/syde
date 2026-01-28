import { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client"; // Keep for types if implicitly needed, or remove if unused. Types don't use it.
// Actually, types don't rely on the client import.

type ShowcaseRow = Database["public"]["Tables"]["showcases"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ShowcaseMember {
  id: string;
  user_id: string;
  display_order: number;
  profile: ProfileRow | null; // Joined profile data
}

// Redeclare common properties to ensure availability
export interface OptimizedShowcase extends ShowcaseRow {
  name: string;
  short_description: string;
  description: string | null;
  thumbnail_url: string | null;
  user_id: string;
  profiles: ProfileRow | null;
  showcase_likes: Array<{ user_id: string }>;
  showcase_bookmarks: Array<{ user_id: string }>;
  showcase_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
  members: ShowcaseMember[]; // Added members array
  // Joined tables
  showcases_images?: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  showcases_links?: Array<{
    id: string;
    type: string;
    url: string;
  }>;
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
