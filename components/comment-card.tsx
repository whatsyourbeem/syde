import Image from 'next/image';
import Link from 'next/link';

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      updated_at: string;
    } | null;
  };
}

export function CommentCard({ comment }: CommentCardProps) {
  const avatarUrlWithCacheBuster = comment.profiles?.avatar_url
    ? `${comment.profiles.avatar_url}?t=${new Date(comment.profiles.updated_at).getTime()}`
    : null;

  const commentDate = new Date(comment.created_at).toLocaleString();

  return (
    <div className="flex items-start gap-3 p-2 border-b last:border-b-0">
      {avatarUrlWithCacheBuster && (
        <Link href={`/${comment.profiles?.username || comment.user_id}`}>
          <Image
            src={avatarUrlWithCacheBuster}
            alt={`${comment.profiles?.username || 'User'}'s avatar`}
            width={32}
            height={32}
            className="rounded-full object-cover flex-shrink-0"
          />
        </Link>
      )}
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <Link href={`/${comment.profiles?.username || comment.user_id}`}>
            <p className="font-semibold text-sm hover:underline">
              {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground">@{comment.profiles?.username || comment.user_id}</p>
          <p className="text-xs text-muted-foreground ml-auto">{commentDate}</p>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
}
