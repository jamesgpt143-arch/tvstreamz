import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Eye, Users, TrendingUp, Calendar, Film, Tv, MessageSquare, ExternalLink } from "lucide-react";
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
import { ChannelManager } from "@/components/admin/ChannelManager";
import { WelcomePopupSettings } from "@/components/admin/WelcomePopupSettings";
import { PagePopupSettings } from "@/components/admin/PagePopupSettings";

interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

interface ContentStats {
  title: string;
  type: string;
  count: number;
}

interface PageStats {
  path: string;
  count: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topContent, setTopContent] = useState<ContentStats[]>([]);
  const [topPages, setTopPages] = useState<PageStats[]>([]);
  const [totals, setTotals] = useState({
    totalViews: 0,
    todayViews: 0,
    uniqueVisitors: 0,
    weeklyVisitors: 0,
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);

    // Get total views
    const { count: totalViews } = await supabase
      .from("site_analytics")
      .select("*", { count: "exact", head: true });

    // Get today's views
    const { count: todayViews } = await supabase
      .from("site_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get unique visitors
    const { data: allVisitors } = await supabase
      .from("site_analytics")
      .select("visitor_id");
    const uniqueVisitors = new Set(allVisitors?.map((v) => v.visitor_id)).size;

    // Get weekly visitors
    const { data: weekVisitors } = await supabase
      .from("site_analytics")
      .select("visitor_id")
      .gte("created_at", last7Days.toISOString());
    const weeklyVisitors = new Set(weekVisitors?.map((v) => v.visitor_id)).size;

    setTotals({
      totalViews: totalViews || 0,
      todayViews: todayViews || 0,
      uniqueVisitors,
      weeklyVisitors,
    });

    // Get daily stats for last 30 days
    const { data: dailyData } = await supabase
      .from("site_analytics")
      .select("created_at, visitor_id")
      .gte("created_at", last30Days.toISOString())
      .order("created_at", { ascending: true });

    // Process daily stats
    const dailyMap = new Map<string, { dateKey: string; dateObj: Date; views: number; visitors: Set<string> }>();
    dailyData?.forEach((item) => {
      const dateObj = new Date(item.created_at);
      const dateKey = format(dateObj, "yyyy-MM-dd"); // Use sortable date format as key
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { dateKey, dateObj, views: 0, visitors: new Set() });
      }
      const stat = dailyMap.get(dateKey)!;
      stat.views++;
      stat.visitors.add(item.visitor_id);
    });

    // Convert to array and sort by dateKey (yyyy-MM-dd format sorts correctly)
    const dailyStatsArray: DailyStats[] = Array.from(dailyMap.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((value) => ({
        date: format(value.dateObj, "MMM dd"),
        views: value.views,
        visitors: value.visitors.size,
      }));
    
    setDailyStats(dailyStatsArray);

    // Get top content
    const { data: contentData } = await supabase
      .from("site_analytics")
      .select("content_title, content_type")
      .not("content_id", "is", null)
      .limit(500);

    const contentMap = new Map<string, { type: string; count: number }>();
    contentData?.forEach((item) => {
      if (item.content_title) {
        const key = item.content_title;
        if (!contentMap.has(key)) {
          contentMap.set(key, { type: item.content_type || "movie", count: 0 });
        }
        contentMap.get(key)!.count++;
      }
    });

    const topContentArray: ContentStats[] = [];
    contentMap.forEach((value, key) => {
      topContentArray.push({ title: key, type: value.type, count: value.count });
    });
    topContentArray.sort((a, b) => b.count - a.count);
    setTopContent(topContentArray.slice(0, 10));

    // Get top pages
    const { data: pageData } = await supabase
      .from("site_analytics")
      .select("page_path")
      .limit(500);

    const pageMap = new Map<string, number>();
    pageData?.forEach((item) => {
      pageMap.set(item.page_path, (pageMap.get(item.page_path) || 0) + 1);
    });

    const topPagesArray: PageStats[] = [];
    pageMap.forEach((count, path) => {
      topPagesArray.push({ path, count });
    });
    topPagesArray.sort((a, b) => b.count - a.count);
    setTopPages(topPagesArray.slice(0, 5));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80 mb-8" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Tv className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Welcome Popup
            </TabsTrigger>
            <TabsTrigger value="page-popups" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Page Popups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totals.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time page views</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Views
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totals.todayViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Views today</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Visitors
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totals.uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time unique visitors</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Visitors
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totals.weeklyVisitors.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views Trend Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Views Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 overflow-x-auto">
                <div style={{ minWidth: Math.max(600, dailyStats.length * 40) }}>
                  <ResponsiveContainer width="100%" height={288}>
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
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
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.3)"
                        name="Views"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visitors Trend Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Daily Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 overflow-x-auto">
                <div style={{ minWidth: Math.max(600, dailyStats.length * 40) }}>
                  <ResponsiveContainer width="100%" height={288}>
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
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
                      <Bar
                        dataKey="visitors"
                        fill="hsl(var(--primary))"
                        name="Unique Visitors"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Film className="h-5 w-5" />
                Top Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topContent.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No content views yet</p>
                ) : (
                  topContent.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.type}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">{item.count} views</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {topPages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No page views yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topPages}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="path"
                        label={({ path, percent }) =>
                          `${path} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {topPages.map((_, index) => (
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

          </TabsContent>

          <TabsContent value="channels">
            <ChannelManager />
          </TabsContent>


          <TabsContent value="settings">
            <WelcomePopupSettings />
          </TabsContent>

          <TabsContent value="page-popups">
            <PagePopupSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
