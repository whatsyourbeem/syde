
import ClubCard from './club-card';
import { Database } from '@/types/database.types';

type Club = Database['public']['Tables']['clubs']['Row'] & {
  owner_profile: Database['public']['Tables']['profiles']['Row'] | null;
  member_count: number;
};

interface ClubListProps {
  clubs: Club[];
}

export default function ClubList({ clubs }: ClubListProps) {
  return (
    <div>
      {clubs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>해당 클럽이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
