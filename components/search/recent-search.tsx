'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { History, X } from 'lucide-react';

export function RecentSearch() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const clearAll = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  const removeSearch = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  if (recentSearches.length === 0) return null;

  return (
    <div
      className="w-full max-w-[720px] py-3"
      style={{ borderBottom: '0.5px solid #B7B7B7' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2">
        <span className="text-xs font-semibold text-[#777777] leading-[150%]">최근 검색</span>
        <button
          onClick={clearAll}
          className="text-xs font-normal text-[#777777] leading-[150%] hover:underline"
        >
          모두 삭제하기
        </button>
      </div>
      {/* Items */}
      {recentSearches.slice(0, 5).map((search, index) => (
        <div
          key={index}
          className="flex items-center gap-[5px] px-3 py-2 mx-4 rounded-xl hover:bg-gray-50"
        >
          <button
            onClick={() => handleSearch(search)}
            className="flex items-center gap-[5px] flex-1 text-left"
          >
            <History className="h-[18px] w-[18px] text-[#777777] shrink-0" strokeWidth={2} />
            <span className="text-sm font-normal text-[#777777] leading-[150%] flex-1">{search}</span>
          </button>
          <button
            onClick={() => removeSearch(search)}
            className="shrink-0 p-0.5 hover:bg-gray-200 rounded-full"
          >
            <X className="h-[18px] w-[18px] text-[#777777]" strokeWidth={1} />
          </button>
        </div>
      ))}
    </div>
  );
}
