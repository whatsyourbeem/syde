
import { ListEmptyState } from "@/components/common/list-empty-state";
import ClubCard from './club-card';
import { Database } from '@/types/database.types';
import { PublicProfile } from '@/types/profile';

type Club = Database['public']['Tables']['clubs']['Row'] & {
  owner_profile: PublicProfile | null;
  member_count: number;
  members: PublicProfile[]; // Add members array
};

interface ClubListProps {
  clubs: Club[];
}

export default function ClubList({ clubs }: ClubListProps) {
  return (
    <div>
      {clubs.length === 0 ? (
        <ListEmptyState>아직 등록된 클럽이 없어요.</ListEmptyState>
      ) : (
        <div className="flex flex-col">
          {clubs.map((club) => (
            <div key={club.id} className="border-b last:border-b-0">
              <ClubCard club={club} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
