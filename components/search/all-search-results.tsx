'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Calendar, MapPin } from 'lucide-react';


function formatDate(dateString: string) {
  const date = new Date(dateString);
  const kstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const year = kstDate.getFullYear().toString().slice(-2);
  const month = (kstDate.getMonth() + 1).toString().padStart(2, '0');
  const day = kstDate.getDate().toString().padStart(2, '0');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[kstDate.getDay()];
  const hours24 = kstDate.getHours();
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const period = hours24 < 12 ? '오전' : '오후';
  const minutes = kstDate.getMinutes().toString().padStart(2, '0');
  return `${year}.${month}.${day}(${weekday}) ${period} ${hours12}:${minutes}`;
}

const PREVIEW_COUNT = 3;

interface AllSearchResultsProps {
  searchQuery: string;
}

function SectionHeader({ label, tab, q }: { label: string; tab: string; q: string }) {
  return (
    <div
      className="flex justify-between items-center px-1 pb-2"
      style={{ borderBottom: '1px solid #E5E5E5' }}
    >
      <span className="text-sm font-semibold text-sydeblue">{label}</span>
      <Link
        href={`/search?q=${encodeURIComponent(q)}&tab=${tab}`}
        className="flex items-center gap-0.5 text-xs text-[#777777] hover:text-sydeblue transition-colors"
      >
        더 보기 <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function AllSearchResults({ searchQuery }: AllSearchResultsProps) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ['all-search', searchQuery],
    queryFn: async () => {
      const escaped = searchQuery.replace(/"/g, '\\"');
      const q = `%${escaped}%`;

      const [logsRes, usersRes, clubsRes, meetupsRes, insightsRes, showcasesRes] = await Promise.all([
        // Logs
        supabase
          .from('logs')
          .select('id, content, created_at, profiles(username, avatar_url, full_name)')
          .ilike('content', q)
          .order('created_at', { ascending: false })
          .limit(PREVIEW_COUNT),

        // Users
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, tagline')
          .or(`username.ilike."${q}",full_name.ilike."${q}",tagline.ilike."${q}"`)
          .limit(PREVIEW_COUNT),

        // Clubs
        supabase
          .from('clubs')
          .select('id, name, tagline, thumbnail_url')
          .or(`name.ilike."${q}",tagline.ilike."${q}"`)
          .limit(PREVIEW_COUNT),

        // Meetups
        supabase
          .from('meetups')
          .select('*, organizer_profile:profiles!organizer_id(*), clubs:clubs(*)')
          .or(`title.ilike."${q}",location.ilike."${q}"`)
          .order('start_datetime', { ascending: false })
          .limit(PREVIEW_COUNT),

        // Insights
        supabase
          .from('insights')
          .select('id, title, summary, image_url, created_at, profiles(username, avatar_url, full_name)')
          .or(`title.ilike."${q}",summary.ilike."${q}"`)
          .order('created_at', { ascending: false })
          .limit(PREVIEW_COUNT),

        // Showcases
        supabase
          .from('showcases')
          .select('id, name, short_description, thumbnail_url')
          .or(`name.ilike."${q}",short_description.ilike."${q}"`)
          .limit(PREVIEW_COUNT),
      ]);

      return {
        logs: logsRes.data || [],
        users: usersRes.data || [],
        clubs: clubsRes.data || [],
        meetups: meetupsRes.data || [],
        insights: insightsRes.data || [],
        showcases: showcasesRes.data || [],
      };
    },
    enabled: !!searchQuery,
  });

  if (isLoading) {
    return <div className="text-center py-10 text-sm text-[#777777]">검색 중...</div>;
  }

  const sections = [
    { key: 'logs', label: '로그', tab: 'logs', items: data?.logs || [] },
    { key: 'users', label: 'SYDERs', tab: 'users', items: data?.users || [] },
    { key: 'clubs', label: '클럽', tab: 'clubs', items: data?.clubs || [] },
    { key: 'meetups', label: '모임', tab: 'meetups', items: data?.meetups || [] },
    { key: 'insights', label: '인사이트', tab: 'insights', items: data?.insights || [] },
    { key: 'showcases', label: '쇼케이스', tab: 'showcase', items: data?.showcases || [] },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-3">
          <SectionHeader label={section.label} tab={section.tab} q={searchQuery} />

          {/* Log items */}
          {section.key === 'logs' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((log) => (
                <Link
                  key={log.id}
                  href={`/log/${log.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gray-200">
                    {log.profiles?.avatar_url && (
                      <Image src={log.profiles.avatar_url} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-[#777777]">
                      {log.profiles?.full_name || log.profiles?.username}
                    </span>
                    <p className="text-sm text-sydeblue line-clamp-1">{log.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* User items */}
          {section.key === 'users' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((user) => (
                <Link
                  key={user.id}
                  href={`/${user.username}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  <div className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gray-200">
                    {user.avatar_url && (
                      <Image src={user.avatar_url} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-sydeblue truncate">
                      {user.full_name || user.username}
                    </span>
                    {user.tagline && (
                      <span className="text-xs text-[#777777] truncate">{user.tagline}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Club items */}
          {section.key === 'clubs' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((club) => (
                <Link
                  key={club.id}
                  href={`/club/${club.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    {club.thumbnail_url && (
                      <Image src={club.thumbnail_url} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-sydeblue truncate">{club.name}</span>
                    {club.tagline && (
                      <span className="text-xs text-[#777777] truncate">{club.tagline}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Meetup items */}
          {section.key === 'meetups' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((meetup) => (
                <Link
                  key={meetup.id}
                  href={`/meetup/${meetup.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  {meetup.thumbnail_url && (
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <Image src={meetup.thumbnail_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-sm font-semibold text-sydeblue line-clamp-1">{meetup.title}</span>
                    {meetup.start_datetime && (
                      <span className="flex items-center gap-1 text-xs text-[#777777]">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(meetup.start_datetime)}
                      </span>
                    )}
                    {meetup.location && (
                      <span className="flex items-center gap-1 text-xs text-[#777777] truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {meetup.location}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Insight items */}
          {section.key === 'insights' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((insight) => (
                <Link
                  key={insight.id}
                  href={`/insight/${insight.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  {insight.image_url && (
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <Image src={insight.image_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-sm font-semibold text-sydeblue line-clamp-1">{insight.title}</span>
                    {insight.summary && (
                      <span className="text-xs text-[#777777] line-clamp-1">{insight.summary}</span>
                    )}
                    {insight.profiles && (
                      <span className="flex items-center gap-1 text-xs text-[#777777] truncate">
                        <span className="relative w-4 h-4 shrink-0 rounded-full overflow-hidden bg-gray-200 inline-block">
                          {(insight.profiles as any).avatar_url && (
                            <Image src={(insight.profiles as any).avatar_url} alt="" fill className="object-cover" />
                          )}
                        </span>
                        {(insight.profiles as any).full_name || (insight.profiles as any).username}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Showcase items */}
          {section.key === 'showcases' && (
            <div className="flex flex-col divide-y divide-[#F0F0F0]">
              {(section.items as any[]).map((showcase) => (
                <Link
                  key={showcase.id}
                  href={`/showcase/${showcase.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-1"
                >
                  {showcase.thumbnail_url && (
                    <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <Image src={showcase.thumbnail_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-sydeblue truncate">{showcase.name}</span>
                    {showcase.short_description && (
                      <span className="text-xs text-[#777777] line-clamp-1">{showcase.short_description}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
