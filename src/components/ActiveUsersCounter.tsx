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
    <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 rounded-lg border border-primary/20 ml-4 sm:ml-6">
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {stats.onlineNow}
          <span className="hidden sm:inline"> онлайн</span>
        </span>
      </div>
      <div className="w-px h-3 sm:h-4 bg-border" />
      <div className="flex items-center gap-1 sm:gap-2">
        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {stats.todayVisitors}
          <span className="hidden sm:inline"> сьогодні</span>
        </span>
      </div>
    </div>
  );
};
