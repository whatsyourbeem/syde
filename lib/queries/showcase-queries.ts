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
  showcase_upvotes: Array<{ user_id: string }>;
  showcase_comments: Array<{ id: string }>;
  upvotesCount: number;
  hasUpvoted: boolean;
  members: ShowcaseMember[]; // Added members array
  images: string[];
  web_url: string | null;
  playstore_url: string | null;
  appstore_url: string | null;
  slug: string | null;
}

export interface ShowcaseQueryOptions {
  currentUserId: string | null;
  currentPage: number;
  showcasesPerPage: number;
  filterByUserId?: string;
  filterByParticipantUserId?: string;
  filterByCommentedUserId?: string;
  filterByUpvotedUserId?: string;
  searchQuery?: string;
}

export interface ShowcaseQueryResult {
  showcases: OptimizedShowcase[];
  count: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  currentPage: number;
}

// Client-side implementation has been moved to Server Action: @/app/showcase/showcase-data-actions.ts
// This file now serves as a Type Definition file for Showcase data structures.
