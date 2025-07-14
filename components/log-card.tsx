'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeartIcon } from 'lucide-react'; // Assuming lucide-react is installed

interface LogCardProps {
  log: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      updated_at: string;
    } | null;
  };
  currentUserId: string | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
}

export function LogCard({ log, currentUserId, initialLikesCount, initialHasLiked }: LogCardProps) {
  const supabase = createClient();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
  }, [initialLikesCount, initialHasLiked]);

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${new Date(log.profiles.updated_at).getTime()}`
    : null;

  const logDate = new Date(log.created_at).toLocaleString();

  const handleLike = async () => {
    if (!currentUserId || loading) return;

    setLoading(true);
    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from('log_likes')
        .delete()
        .eq('log_id', log.id)
        .eq('user_id', currentUserId);

      if (!error) {
        setLikesCount((prev) => prev - 1);
        setHasLiked(false);
      } else {
        console.error('Error unliking log:', error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from('log_likes')
        .insert({ log_id: log.id, user_id: currentUserId });

      if (!error) {
        setLikesCount((prev) => prev + 1);
        setHasLiked(true);
      } else {
        console.error('Error liking log:', error);
      }
    }
    setLoading(false);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-card shadow-sm">
      <div className="flex items-center mb-3">
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
        <div>
          <Link href={`/${log.profiles?.username || log.user_id}`}>
            <p className="font-semibold hover:underline">
              {log.profiles?.full_name || log.profiles?.username || 'Anonymous'}
            </p>
          </Link>
          <p className="text-sm text-muted-foreground">@{log.profiles?.username || log.user_id}</p>
        </div>
        <p className="text-xs text-muted-foreground ml-auto">{logDate}</p>
      </div>
      <p className="mb-3 text-base">{log.content}</p>
      {log.image_url && (
        <div className="relative w-full h-64 mb-3 rounded-md overflow-hidden">
          <Image
            src={log.image_url}
            alt="Log image"
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
        <div className="flex items-center gap-1 cursor-pointer" onClick={handleLike}>
          <HeartIcon
            className={hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
            size={18}
          />
          <span>{likesCount} Likes</span>
        </div>
        <span>0 Comments</span>
      </div>
    </div>
  );
}
