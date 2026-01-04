import { useEffect, useState } from 'react';
import { getAnalyticsStats } from '@/lib/analytics';
import { Eye, Users, TrendingUp, Film } from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  todayViews: number;
  uniqueVisitors: number;
  weeklyVisitors: number;
  topContent: Array<{
    title: string;
    type: string;
    id: string;
    count: number;
  }>;
}

export const SiteAnalytics = () => {
  const [stats, setStats] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getAnalyticsStats();
      setStats(data);
    };
    loadStats();
  }, []);

  if (!stats) return null;

  return (
    <section className="py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold mb-6 text-center">📊 Site Statistics</h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card/50 rounded-lg p-4 text-center border border-border/50">
            <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          
          <div className="bg-card/50 rounded-lg p-4 text-center border border-border/50">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.todayViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Today's Views</p>
          </div>
          
          <div className="bg-card/50 rounded-lg p-4 text-center border border-border/50">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </div>
          
          <div className="bg-card/50 rounded-lg p-4 text-center border border-border/50">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.weeklyVisitors.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Weekly Visitors</p>
          </div>
        </div>

        {/* Popular Content */}
        {stats.topContent.length > 0 && (
          <div className="bg-card/30 rounded-lg p-4 border border-border/50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Popular Content
            </h4>
            <div className="space-y-2">
              {stats.topContent.map((item, index) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {index + 1}. {item.title}
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    {item.count} views
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
