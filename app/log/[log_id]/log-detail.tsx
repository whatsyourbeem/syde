'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { linkifyMentions } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { LogForm } from '@/components/log-form';
import { LogActions } from './log-actions';
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";

interface LogDetailProps {
  log: any; // Consider defining a more specific type
  user: User | null;
}

export function LogDetail({ log: initialLog, user }: LogDetailProps) {
  const supabase = createClient();
  const [log, setLog] = useState(initialLog);
  const [isEditing, setIsEditing] = useState(false);
  const [mentionedProfiles, setMentionedProfiles] = useState<any[]>([]);

  // New states for likes
  const [currentLikesCount, setCurrentLikesCount] = useState(initialLog.log_likes.length);
  const [currentHasLiked, setCurrentHasLiked] = useState(
    user ? initialLog.log_likes.some((like: { user_id: string }) => like.user_id === user.id) : false
  );

  useEffect(() => {
    const fetchMentionedProfiles = async () => {
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      const matches = log.content.matchAll(mentionRegex);
      for (const match of matches) {
        mentionedUserIds.add(match[1]);
      }

      if (mentionedUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(mentionedUserIds));

        if (profilesError) {
          console.error('Error fetching mentioned profiles:', profilesError);
        } else {
          setMentionedProfiles(profilesData);
        }
      }
    };

    fetchMentionedProfiles();

    // New: Fetch latest likes data when component mounts or log.id changes
    const fetchLatestLikes = async () => {
      const { data: likesData, error: likesError } = await supabase
        .from('log_likes')
        .select('user_id')
        .eq('log_id', log.id);

      if (likesError) {
        console.error('Error fetching latest likes:', likesError);
        return;
      }

      const latestLikesCount = likesData?.length || 0;
      const latestHasLiked = user ? likesData?.some((like: { user_id: string }) => like.user_id === user.id) : false;

      setCurrentLikesCount(latestLikesCount);
      setCurrentHasLiked(latestHasLiked);
    };

    fetchLatestLikes();

  }, [log.content, log.id, user?.id, supabase]); // Add log.id and user.id to dependencies

  const handleLogUpdate = (updatedLog: any) => {
    setLog((prevLog: any) => ({
      ...prevLog,
      content: updatedLog.content,
      image_url: updatedLog.image_url,
    }));
    setIsEditing(false);
  };

  // New: Handler for when like status changes in LogActions
  const handleLikeStatusChange = (newLikesCount: number, newHasLiked: boolean) => {
    setCurrentLikesCount(newLikesCount);
    setCurrentHasLiked(newHasLiked);
  };

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${new Date(log.profiles.updated_at).getTime()}`
    : null;

  const logDate = new Date(log.created_at).toLocaleString();

  return (
    <div className="rounded-lg p-4 bg-card shadow-sm flex flex-col">
      {/* Profile Header and Date */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {avatarUrlWithCacheBuster && (
            <Link href={`/${log.profiles?.username || log.user_id}`}>
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${log.profiles?.username || 'User'}'s avatar`}
                width={40}
                height={40}
                className="rounded-full object-cover mr-3"
              />
            </Link>
          )}
          <div className="flex-grow">
            <div className="flex items-baseline gap-2">
              <Link href={`/${log.profiles?.username || log.user_id}`}>
                <p className="font-semibold hover:underline">
                  {log.profiles?.full_name || log.profiles?.username || 'Anonymous'}
                </p>
              </Link>
              {log.profiles?.username && (
                <p className="text-sm text-muted-foreground">@{log.profiles.username}</p>
              )}
            </div>
            {log.profiles?.tagline && (
              <p className="text-xs text-muted-foreground">{log.profiles.tagline}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{logDate}</p>
      </div>

      {/* Log Content or Edit Form */}
      {isEditing ? (
        <LogForm
          userId={user?.id || null}
          initialLogData={log}
          onLogUpdated={handleLogUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="py-4 my-4">
          <p className="mb-3 text-base whitespace-pre-wrap leading-relaxed">
            {linkifyMentions(log.content, mentionedProfiles)}
          </p>
          {log.image_url && (
            <div className="relative w-full h-72 mt-4 rounded-lg overflow-hidden shadow-md">
              <Image
                src={log.image_url}
                alt="Log image"
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions (Likes, Edit/Delete) */}
      <LogActions
        log={log}
        currentUserId={user?.id || null}
        likesCount={currentLikesCount}
        hasLiked={currentHasLiked}
        initialCommentsCount={log.log_comments.length}
        isEditing={isEditing}
        onEditClick={() => setIsEditing(true)}
        onLikeStatusChange={handleLikeStatusChange}
      />

      {/* Comments Section */}
      <div className="mt-8 pt-4">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <CommentForm logId={log.id} currentUserId={user?.id || null} />
        <CommentList logId={log.id} currentUserId={user?.id || null} />
      </div>
    </div>
  );
}
