import { Users, Eye } from 'lucide-react';
import { useActiveUsers } from '@/hooks/useActiveUsers';

interface ActiveUsersCounterProps {
  userEmail: string | null;
}

export const ActiveUsersCounter = ({ userEmail }: ActiveUsersCounterProps) => {
  const { stats, isAdmin } = useActiveUsers(userEmail);

  if (!isAdmin || stats.isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Users className="h-4 w-4 text-green-500" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {stats.onlineNow} онлайн
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">
          {stats.todayVisitors} сьогодні
        </span>
      </div>
    </div>
  );
};
