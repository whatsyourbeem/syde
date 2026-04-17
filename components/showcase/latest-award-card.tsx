"use client";

import { OptimizedShowcase } from "@/lib/queries/showcase-queries";
import { formatSydePickDateKR } from "@/lib/utils";
import { ShowcaseCard } from "@/components/showcase/showcase-card";

interface LatestAwardCardProps {
  showcase: OptimizedShowcase;
  currentUserId: string | null;
}

export function LatestAwardCard({ showcase, currentUserId }: LatestAwardCardProps) {
  const pickAward = showcase.showcase_awards.find(a => a.type === 'SYDE_PICK');
  const formattedDate = pickAward ? formatSydePickDateKR(pickAward.date) : '';

  return (
    <ShowcaseCard 
      showcase={showcase}
      currentUserId={currentUserId}
      initialUpvotesCount={showcase.upvotesCount}
      initialHasUpvoted={showcase.hasUpvoted}
      initialCommentsCount={showcase.showcase_comments.length}
      initialViewsCount={showcase.views_count}
      mentionedProfiles={[]}
      variant="featured"
      awardDateLabel={formattedDate}
    />
  );
}
