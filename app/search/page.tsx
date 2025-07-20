import { createClient } from "@/lib/supabase/server";
import { SearchForm } from "@/components/search-form";
import { LogListWrapper } from "@/components/log-list-wrapper";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { q } = await searchParams;
  // const searchQuery = await searchParams.q; // <-- await added here

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center p-5">
      <div className="w-full max-w-2xl mx-auto mb-8">
        <SearchForm />
      </div>
      {q ? (
        <LogListWrapper currentUserId={user?.id || null} searchQuery={q} />
      ) : (
        <div className="text-center text-muted-foreground mt-10">
          <h2 className="text-2xl font-bold mb-4">로그 검색</h2>
          <p className="text-lg">검색어를 입력하여 원하는 로그를 찾아보세요.</p>
          <p className="text-sm mt-2">
            사용자 이름, 내용 등으로 검색할 수 있습니다.
          </p>
        </div>
      )}
    </main>
  );
}
