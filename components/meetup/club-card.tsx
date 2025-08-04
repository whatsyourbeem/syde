
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
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
    <Link href={`/gathering/club/${club.id}`} className="block">
      <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden w-full flex items-start gap-4 p-4">
        <div className="flex-shrink-0">
          <Image
            src={club.thumbnail_url || 'https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png'}
            alt={club.name}
            width={192} // w-48 (192px)
            height={128} // h-32 (128px)
            className="w-32 h-32 md:w-48 object-cover rounded-md"
          />
        </div>
        <div className="flex-grow">
          <h2 className="text-lg font-semibold mb-1 line-clamp-2">
            {club.name}
          </h2>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{club.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={club.owner_profile?.avatar_url || undefined} />
                <AvatarFallback>{club.owner_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <p>
                <span className="font-semibold text-black">{club.owner_profile?.full_name || club.owner_profile?.username || '알 수 없음'}</span>
                <span className="ml-1">클럽장</span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-4" />
              <span>{club.member_count}명</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
