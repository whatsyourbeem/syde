import { Suspense } from "react";
import { getCachedLogs } from "@/lib/cache/log-cache";
import { LogCard } from "@/components/log/log-card";
import { LoadingList } from "@/components/ui/loading-states";

interface LogListServerProps {
  currentUserId: string | null;
  currentPage?: number;
  logsPerPage?: number;
}

async function LogListContent({ 
  currentUserId, 
  currentPage = 1, 
  logsPerPage = 20 
}: LogListServerProps) {
  const logsData = await getCachedLogs({
    currentUserId,
    currentPage,
    logsPerPage,
  });

  if (logsData.logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-4 py-4">
      {logsData.logs.map((log, index) => (
        <div key={log.id}>
          <LogCard
            log={log}
            currentUserId={currentUserId}
            initialLikesCount={log.likesCount}
            initialHasLiked={log.hasLiked}
            initialBookmarksCount={log.bookmarksCount}
            initialHasBookmarked={log.hasBookmarked}
            initialCommentsCount={log.log_comments.length}
            mentionedProfiles={logsData.mentionedProfiles}
            isDetailPage={false}
          />
          {index < logsData.logs.length - 1 && (
            <div className="border-b border-gray-200 my-4"></div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LogListServer(props: LogListServerProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
          <LoadingList count={5} />
        </div>
      }
    >
      <LogListContent {...props} />
    </Suspense>
  );
}