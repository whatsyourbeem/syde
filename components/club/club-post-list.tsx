import Link from 'next/link';
import { Tables } from '@/types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Profile = Tables<'profiles'>;
type ClubForumPost = Tables<'club_forum_posts'> & { author: Profile | null };

interface ClubPostListProps {
  posts: ClubForumPost[];
  clubId: string;
}

export default function ClubPostList({ posts, clubId }: ClubPostListProps) {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-500 py-8">아직 게시글이 없습니다.</p>;
  }

  return (
    <div className="border-t">
      <ul className="divide-y">
        {posts.map(post => (
          <li key={post.id} className="p-4 hover:bg-gray-50">
            <Link href={`/socialing/club/${clubId}/post/${post.id}`} className="block">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold truncate">{post.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at!).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="size-5">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback>{post.author?.username?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">{post.author?.username || 'Unknown User'}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
