"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin, User, Users } from "lucide-react";
import {
  ActivityFeedItem,
  getActivityMessage,
  getActivityLink,
} from "@/lib/queries/feed-queries";
import { ensureSecureImageUrl } from "@/lib/utils";

interface ActivityCardProps {
  activity: ActivityFeedItem;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function ActivityCardBase({ activity }: ActivityCardProps) {
  const profile = activity.profiles;
  const displayName = profile?.full_name || profile?.username || "알 수 없는 사용자";
  const avatarUrl = profile?.avatar_url || "/default_avatar.png";
  const message = getActivityMessage(activity, ""); // Pass empty for name to get the rest of the message
  const link = getActivityLink(activity);
  const details = activity.details;

  const renderPreview = () => {
    if (!details) return null;

    if (details.showcase) {
      const { showcase } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {showcase.thumbnail_url && ensureSecureImageUrl(showcase.thumbnail_url) && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(showcase.thumbnail_url)!}
                alt="Showcase thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <h4 className="text-base font-semibold truncate leading-tight">
              {activity.target_title}
            </h4>
            {showcase.short_description && (
              <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">
                {showcase.short_description}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (details.insight) {
      const { insight } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {insight.image_url && ensureSecureImageUrl(insight.image_url) && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(insight.image_url)!}
                alt="Insight thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <h4 className="text-base font-semibold truncate leading-tight">
              {activity.target_title}
            </h4>
            {insight.summary && (
              <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">
                {insight.summary}
              </p>
            )}
            {insight.content_preview && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                {insight.content_preview}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (details.meetup) {
      const { meetup } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {meetup.thumbnail_url && ensureSecureImageUrl(meetup.thumbnail_url) && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(meetup.thumbnail_url)!}
                alt="Meetup thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <h4 className="text-base font-semibold truncate leading-tight">
              {activity.target_title}
            </h4>
            <div className="flex flex-col gap-0.5">
              {meetup.start_datetime && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={13} className="shrink-0" />
                  <span>
                    {format(new Date(meetup.start_datetime), "M월 d일 (eee) a h:mm", { locale: ko })}
                  </span>
                </div>
              )}
              {meetup.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{meetup.location}</span>
                </div>
              )}
              {(meetup.club_name || meetup.organizer_name) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {meetup.club_name ? (
                    <Users size={13} className="shrink-0" />
                  ) : (
                    <User size={13} className="shrink-0" />
                  )}
                  <span className="truncate">
                    {meetup.club_name || meetup.organizer_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const content = (
    <div className="flex items-start gap-2 py-1 transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Image
          src={
            profile?.updated_at
              ? `${avatarUrl}?t=${new Date(profile.updated_at).getTime()}`
              : avatarUrl
          }
          alt={displayName}
          width={36}
          height={36}
          className="rounded-full object-cover border border-border/50"
          style={{ width: 36, height: 36 }}
        />
      </div>

      {/* Content Area: Message + Preview */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Message & Timestamp */}
        <p className="text-sm md:text-log-content text-foreground/90 leading-normal">
          <span className="font-bold">{displayName}</span>
          <span>{message}</span>
          <span className="ml-1.5 text-[11px] md:text-xs text-muted-foreground/70 whitespace-nowrap inline-block">
            · {formatTimeAgo(activity.created_at)}
          </span>
        </p>

        {/* Optional Preview Content */}
        {renderPreview()}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

export const ActivityCard = memo(ActivityCardBase);
ActivityCard.displayName = "ActivityCard";
