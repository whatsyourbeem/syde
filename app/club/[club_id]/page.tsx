import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClubDetailClient from "@/components/club/club-detail-client";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";
import { Metadata, ResolvingMetadata } from "next";
import { getClubDetailCached, getClubForumsCached } from "@/lib/queries/club-queries";

type ClubDetailPageProps = {
  params: Promise<{
    club_id: string;
  }>;
};

export async function generateMetadata(
  { params }: ClubDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { club_id } = await params;
  const supabase = await createClient();

  const club = await getClubDetailCached(supabase, club_id);

  if (!club) {
    return {
      title: "Club Not Found - SYDE",
    };
  }

  const title = `${club.name} - SYDE 클럽`;

  let plainText = "";
  if (club.tagline) {
    plainText = club.tagline;
  } else {
    let descObj = club.description;
    if (typeof descObj === "string") {
      try {
        descObj = JSON.parse(descObj);
      } catch (e) {
        // ignore
      }
    }

    if (descObj && typeof descObj === "object") {
      try {
        const extractText = (node: any): string => {
          if (node.type === "text" && node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join(" ");
          }
          return "";
        };
        plainText = extractText(descObj).trim();
      } catch (e) {
        // ignore
      }
    } else if (typeof descObj === "string") {
      plainText = descObj;
    }
  }

  const description = plainText.length > 160 ? plainText.slice(0, 160) + "..." : (plainText || "SYDE 클럽에 참여해보세요.");
  const images = club.thumbnail_url ? [club.thumbnail_url] : ["/we-are-syders.png"];

  return {
    title,
    description,
    alternates: {
      canonical: `/club/${club_id}`,
    },
    openGraph: {
      title,
      description,
      images,
      type: "website",
      url: `/club/${club_id}`,
    },
  };
}

export default async function ClubDetailPage({ params }: ClubDetailPageProps) {
  const { club_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch club details and forums cached (parallel and cached)
  const [club, forums] = await Promise.all([
    getClubDetailCached(supabase, club_id),
    getClubForumsCached(supabase, club_id),
  ]);

  if (!club) {
    notFound();
  }

  // Fetch meetups associated with the club
  const { data: meetups, error: meetupsError } = await supabase
    .from("meetups")
    .select("*, clubs(*), organizer_profile:profiles!meetups_organizer_id_fkey(*)")
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });
 
   if (meetupsError) {
     // Handle errors appropriately
     console.error(meetupsError);
     // Potentially show an error page
     notFound();
   }
 
   // Check if the current user is a member and get their role
   const isOwner = user?.id === club.owner_id;
 
   const initialHtml = getInitialHtmlFromTiptap(club.description);
 
   return <ClubDetailClient
     club={club}
     initialHtml={initialHtml}
     meetups={meetups || []}
     forums={forums || []}
     currentUserId={user?.id}
     isOwner={isOwner}
   />;
}
