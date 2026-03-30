import { NotificationType } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/utils';
import { HeartIcon, MessageCircle, ArrowUpCircle } from 'lucide-react';

const NotificationItem = ({ notification }: { notification: NotificationType }) => {
  const getMessage = () => {
    const triggerUsername = notification.trigger_user?.username ?? '누군가';
    
    if (notification.type === 'like' || notification.type === 'comment') {
      const logContent = notification.logs?.content
        ? notification.logs.content.substring(0, 25) + '...'
        : '로그';

      switch (notification.type) {
        case 'like':
          return <p><strong>{triggerUsername}</strong>님이 회원님의 로그를 좋아합니다: &quot;{logContent}&quot;</p>;
        case 'comment':
          return <p><strong>{triggerUsername}</strong>님이 회원님의 로그에 댓글을 남겼습니다: &quot;{logContent}&quot;</p>;
      }
    }

    if (notification.type === 'upvote') {
      const showcaseTitle = notification.showcases?.title ?? '쇼케이스';
      return <p><strong>{triggerUsername}</strong>님이 &apos;{showcaseTitle}&apos;을 업보트했습니다</p>;
    }

    return <p>새로운 알림</p>;
  };

  return (
    <div className={`flex items-center p-2 rounded-md ${!notification.is_read ? 'bg-blue-50' : ''}`}>
      <div className="relative mr-3 min-w-[32px]">
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.trigger_user?.avatar_url ?? undefined} />
          <AvatarFallback>{notification.trigger_user?.username?.[0]}</AvatarFallback>
        </Avatar>
        {(notification.type === 'like' || notification.type === 'upvote') && (
          <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${notification.type === 'like' ? 'bg-red-500' : 'bg-orange-500'}`}>
            {notification.type === 'like' ? (
              <HeartIcon className="h-3 w-3 text-white fill-white" />
            ) : (
              <ArrowUpCircle className="h-3 w-3 text-white fill-white" />
            )}
          </div>
        )}
        {notification.type === 'comment' && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
            <MessageCircle className="h-3 w-3 text-white fill-white" />
          </div>
        )}
      </div>
      <div className="text-sm">
        {getMessage()}
        <p className="text-xs text-gray-500">{formatRelativeTime(notification.created_at)}</p>
      </div>
    </div>
  );
};

export default NotificationItem;
