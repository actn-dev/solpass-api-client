"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Ticket } from "lucide-react";

interface AnalyticsTabProps {
  eventId: string;
}

export function AnalyticsTab({ eventId }: AnalyticsTabProps) {
  // Fetch daily analytics data
  const { data: dailyData, isLoading } = useQuery({
    queryKey: ["event-daily-analytics", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}/analytics/daily", {
        params: { path: { id: eventId } },
      });
      return (response.data as any)?.dailySales || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sales data available yet</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for charts
  const chartData = dailyData.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    sales: day.ticketsSold || 0,
    revenue: day.revenue || 0,
    resales: day.resales || 0,
  }));

  // Calculate summary stats
  const totalSales = chartData.reduce((sum: number, day: any) => sum + day.sales, 0);
  const totalResales = chartData.reduce((sum: number, day: any) => sum + day.resales, 0);
  const totalRevenue = chartData.reduce((sum: number, day: any) => sum + day.revenue, 0);
  const avgDailySales = (totalSales / chartData.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {avgDailySales} per day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResales}</div>
            <p className="text-xs text-muted-foreground">
              {totalSales > 0 ? ((totalResales / totalSales) * 100).toFixed(1) : 0}% of sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${(totalRevenue / chartData.length).toFixed(2)} per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.length}</div>
            <p className="text-xs text-muted-foreground">
              Sales period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Ticket Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Ticket Sales</CardTitle>
          <CardDescription>
            Number of tickets sold per day (initial sales + resales)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
                name="Initial Sales"
              />
              <Area 
                type="monotone" 
                dataKey="resales" 
                stroke="hsl(var(--destructive))" 
                fillOpacity={1} 
                fill="url(#colorResales)" 
                name="Resales"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue</CardTitle>
          <CardDescription>
            Revenue generated per day in USD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
