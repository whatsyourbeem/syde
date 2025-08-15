
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Database } from '@/types/database.types';

type Club = Database['public']['Tables']['clubs']['Row'] & {
  owner_profile: Database['public']['Tables']['profiles']['Row'] | null;
  member_count: number;
};

interface ClubCardProps {
  club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden w-full flex items-start gap-4 p-4">
      <Link href={`/gathering/club/${club.id}`} className="flex-shrink-0">
        <Image
          src={club.thumbnail_url || 'https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png'}
          alt={club.name}
          width={192}
          height={128}
          className="w-32 h-32 md:w-48 object-cover rounded-md"
        />
      </Link>
      <div className="flex-grow">
        <Link href={`/gathering/club/${club.id}`}>
          <h2 className="text-lg font-semibold mb-1 line-clamp-2 hover:underline">
            {club.name}
          </h2>
        </Link>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <HoverCard openDelay={350}>
            <div className="flex items-center gap-2">
              <HoverCardTrigger asChild>
                <Link href={`/${club.owner_profile?.username}`}>
                  <Avatar className="size-5">
                    <AvatarImage src={club.owner_profile?.avatar_url || undefined} />
                    <AvatarFallback>{club.owner_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Link>
              </HoverCardTrigger>
              <p>
                <HoverCardTrigger asChild>
                  <Link href={`/${club.owner_profile?.username}`}>
                    <span className="font-semibold text-black hover:underline">{club.owner_profile?.full_name || club.owner_profile?.username || '알 수 없음'}</span>
                  </Link>
                </HoverCardTrigger>
                <span className="ml-1">클럽장</span>
              </p>
            </div>
            <HoverCardContent className="w-80" align="start" alignOffset={-28}>
              {club.owner_profile && (
                <Link href={`/${club.owner_profile.username}`}>
                  <div className="flex justify-start space-x-4">
                    {club.owner_profile.avatar_url ? (
                      <Image
                        src={club.owner_profile.avatar_url}
                        alt={`${club.owner_profile.username || "User"}'s avatar`}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl font-semibold">
                          {club.owner_profile.username?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">
                        {club.owner_profile.full_name || ""}
                      </h4>
                      <p className="text-sm">@{club.owner_profile.username || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        {club.owner_profile.tagline || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </HoverCardContent>
          </HoverCard>
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{club.member_count}명</span>
          </div>
        </div>
      </div>
    </div>
  );
}
