"use client";

import { OptimizedShowcase } from "@/lib/queries/showcase-queries";
import { formatSydePickDateKR } from "@/lib/utils";
import { ShowcaseCard } from "@/components/showcase/showcase-card";

interface LatestAwardCardProps {
  showcase: OptimizedShowcase;
  currentUserId: string | null;
}

export function LatestAwardCard({ showcase, currentUserId }: LatestAwardCardProps) {
  const pickAward = showcase.showcase_awards
    .filter(a => a.type === 'SYDE_PICK')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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
