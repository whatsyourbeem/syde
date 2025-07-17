'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XIcon } from 'lucide-react';

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  };

  const clearSearch = () => {
    setQuery('');
    router.push('/');
  };

  return (
    <form onSubmit={handleSearch} className="mb-8 flex items-center gap-2">
      <div className="relative flex-grow">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search logs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}
