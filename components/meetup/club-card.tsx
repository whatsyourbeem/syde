
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
    <Link href={`/club/${club.id}`} className="block">
      <div className="bg-white shadow-md rounded-lg max-w-sm mx-auto border border-gray-200 overflow-hidden h-full">
        <div className="relative">
          <img
            src={club.thumbnail_url || 'https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png'}
            alt={club.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        </div>
        <div className="px-6 pt-4 pb-6">
          <h2 className="text-base font-semibold mb-2 line-clamp-2">
            {club.name}
          </h2>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{club.description}</p>
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
