import { NotificationType } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NotificationItem = ({ notification }: { notification: NotificationType }) => {
  const getMessage = () => {
    const triggerUsername = notification.trigger_user?.username ?? 'Someone';
    const logContent = notification.logs?.content
      ? notification.logs.content.substring(0, 25) + '...'
      : 'a log';

    switch (notification.type) {
      case 'like':
        return <p><strong>{triggerUsername}</strong> liked your log: "{logContent}"</p>;
      case 'comment':
        return <p><strong>{triggerUsername}</strong> commented on your log: "{logContent}"</p>;
      default:
        return <p>New notification</p>;
    }
  };

  return (
    <div className={`flex items-center p-2 rounded-md ${!notification.is_read ? 'bg-blue-50' : ''}`}>
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={notification.trigger_user?.avatar_url ?? undefined} />
        <AvatarFallback>{notification.trigger_user?.username?.[0]}</AvatarFallback>
      </Avatar>
      <div className="text-sm">
        {getMessage()}
        <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default NotificationItem;
