'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', label: '전체' },
  { id: 'logs', label: '로그' },
  { id: 'insights', label: '인사이트' },
  { id: 'showcase', label: '쇼케이스' },
  { id: 'users', label: 'SYDERs' },
  { id: 'meetups', label: '모임' },
  { id: 'clubs', label: '클럽' },
];

export function CategoryTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div
      className="w-full max-w-[720px] flex items-start gap-2 px-4 py-2 overflow-x-auto no-scrollbar"
      style={{ borderTop: '0.5px solid #B7B7B7', borderBottom: '0.5px solid #B7B7B7' }}
    >
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleTabChange(category.id)}
          className={cn(
            'flex items-center justify-center px-3 py-1 h-8 rounded-xl text-sm font-normal whitespace-nowrap transition-colors',
            'font-["Pretendard"] tracking-[0.05em] leading-[17px]',
            currentTab === category.id
              ? 'bg-sydeblue text-white'
              : 'bg-[#FAFAFA] text-[#777777] hover:bg-[#F0F0F0]'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
