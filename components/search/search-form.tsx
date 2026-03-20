'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon, ChevronLeft } from 'lucide-react';

const placeholders: Record<string, string> = {
  all: '관심 주제를 검색해 보세요.',
  logs: '관심 주제를 검색해 보세요.',
  insights: '영감을 주는 인사이트 검색',
  showcase: '다양한 쇼케이스 검색',
  meetups: '새로운 모임을 찾아볼까요?',
  clubs: '함께 성장하는 클럽 찾기',
  users: '영감을 주는 SYDERs 검색',
};

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const currentTab = searchParams.get('tab') || 'all';
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const saveToRecent = (q: string) => {
    if (!q.trim()) return;
    const saved = localStorage.getItem('recentSearches');
    let searches = saved ? JSON.parse(saved) : [];
    searches = [q, ...searches.filter((s: string) => s !== q)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      saveToRecent(trimmed);
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', trimmed);
      router.push(`/search?${params.toString()}`);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      router.push(`/search?${params.toString()}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.push(`/search?${params.toString()}`);
    inputRef.current?.focus();
  };


  const placeholder = placeholders[currentTab] || placeholders.all;

  return (
    <div className="w-full max-w-[720px] px-5">
      <form onSubmit={handleSearch} className="flex items-center gap-3 w-full h-9">
        {/* Back Button */}
        <button
          type="button"
          onClick={clearSearch}
          className="shrink-0 p-0 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6 text-[#434343]" />
        </button>

        {/* Input Area */}
        <div className="relative flex-grow h-full">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-full bg-transparent border-0 outline-none text-xl font-normal text-[#002040] placeholder:text-[#777777] placeholder:text-xl placeholder:font-normal"
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="shrink-0 flex items-center justify-center w-9 h-9 bg-[rgba(34,40,46,0.5)] hover:bg-[rgba(34,40,46,0.7)] rounded-xl transition-colors"
        >
          <SearchIcon className="h-[19px] w-[19px] text-white" />
        </button>
      </form>
    </div>
  );
}