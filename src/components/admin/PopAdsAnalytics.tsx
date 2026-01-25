import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MousePointerClick, Eye, TrendingUp, Target } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

interface DailyPopAdsStats {
  date: string;
  impressions: number;
  clicks: number;
}

interface ClickSourceStats {
  source: string;
  count: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const PopAdsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyPopAdsStats[]>([]);
  const [clickSources, setClickSources] = useState<ClickSourceStats[]>([]);
  const [totals, setTotals] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    todayImpressions: 0,
    todayClicks: 0,
    ctr: 0,
  });

  useEffect(() => {
    loadPopAdsAnalytics();
  }, []);

  const loadPopAdsAnalytics = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last30Days = subDays(today, 30);

      // Get total impressions
      const { count: totalImpressions } = await supabase
        .from("site_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "popads_impression");

      // Get total clicks
      const { count: totalClicks } = await supabase
        .from("site_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "popads_click");

      // Get today's impressions
      const { count: todayImpressions } = await supabase
        .from("site_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "popads_impression")
        .gte("created_at", today.toISOString());

      // Get today's clicks
      const { count: todayClicks } = await supabase
        .from("site_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "popads_click")
        .gte("created_at", today.toISOString());

      // Calculate CTR
      const impressions = totalImpressions || 0;
      const clicks = totalClicks || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      setTotals({
        totalImpressions: impressions,
        totalClicks: clicks,
        todayImpressions: todayImpressions || 0,
        todayClicks: todayClicks || 0,
        ctr,
      });

      // Get daily stats for last 30 days
      const { data: impressionData } = await supabase
        .from("site_analytics")
        .select("created_at")
        .eq("event_type", "popads_impression")
        .gte("created_at", last30Days.toISOString());

      const { data: clickData } = await supabase
        .from("site_analytics")
        .select("created_at")
        .eq("event_type", "popads_click")
        .gte("created_at", last30Days.toISOString());

      // Process daily stats
      const dailyMap = new Map<string, { impressions: number; clicks: number }>();
      
      impressionData?.forEach((item) => {
        const date = format(new Date(item.created_at), "MMM dd");
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { impressions: 0, clicks: 0 });
        }
        dailyMap.get(date)!.impressions++;
      });

      clickData?.forEach((item) => {
        const date = format(new Date(item.created_at), "MMM dd");
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { impressions: 0, clicks: 0 });
        }
        dailyMap.get(date)!.clicks++;
      });

      const dailyStatsArray: DailyPopAdsStats[] = [];
      dailyMap.forEach((value, key) => {
        dailyStatsArray.push({
          date: key,
          impressions: value.impressions,
          clicks: value.clicks,
        });
      });
      setDailyStats(dailyStatsArray);

      // Get click sources
      const { data: sourceData } = await supabase
        .from("site_analytics")
        .select("content_title")
        .eq("event_type", "popads_click")
        .not("content_title", "is", null);

      const sourceMap = new Map<string, number>();
      sourceData?.forEach((item) => {
        if (item.content_title) {
          const source = item.content_title.replace(/_/g, " ").replace(/welcome popup /i, "");
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
        }
      });

      const sourcesArray: ClickSourceStats[] = [];
      sourceMap.forEach((count, source) => {
        sourcesArray.push({ source, count });
      });
      sourcesArray.sort((a, b) => b.count - a.count);
      setClickSources(sourcesArray);

    } catch (error) {
      console.error("Error loading PopAds analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.totalImpressions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time ad loads</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time ad triggers</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Stats
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.todayImpressions} / {totals.todayClicks}
            </div>
            <p className="text-xs text-muted-foreground">Impressions / Clicks</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Click-Through Rate
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.ctr.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Clicks / Impressions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions & Clicks Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">PopAds Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dailyStats.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.3)"
                      name="Impressions"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2) / 0.3)"
                      name="Clicks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Click Sources */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Click Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {clickSources.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No clicks recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clickSources}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="source"
                      label={({ source, percent }) =>
                        `${source} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {clickSources.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Click Sources List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MousePointerClick className="h-5 w-5" />
            Click Sources Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clickSources.length === 0 ? (
              <p className="text-muted-foreground text-sm">No clicks recorded yet</p>
            ) : (
              clickSources.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    <p className="font-medium text-foreground capitalize">{item.source}</p>
                  </div>
                  <span className="font-bold text-foreground">{item.count} clicks</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
