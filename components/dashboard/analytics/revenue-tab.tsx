"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

interface RevenueTabProps {
  eventId: string;
}

export function RevenueTab({ eventId }: RevenueTabProps) {
  // Fetch revenue analytics data
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["event-revenue-analytics", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}/analytics/revenue", {
        params: { path: { id: eventId } },
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-muted-foreground">Loading revenue data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!revenueData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No revenue data available yet</p>
        </CardContent>
      </Card>
    );
  }

  const data = revenueData as any;
  
  const {
    revenue = {},
    transactions = {},
    royalties = {},
    priceStatistics = {},
  } = data;

  const totalRevenue = revenue.totalRevenue || 0;
  const initialSalesRevenue = revenue.primaryRevenue || 0;
  const resaleRevenue = revenue.secondaryRevenue || 0;
  const platformFees = royalties.estimatedRoyalties || 0;
  const royaltyPercentage = royalties.royaltyPercentage || 0;
  const pendingRoyalties = royalties.pendingRoyalties || 0;
  const royaltiesDistributed = royalties.royaltiesDistributed || 0;

  // Prepare data for revenue source pie chart
  const revenueSourceData = [
    { name: "Primary Sales", value: initialSalesRevenue, color: "hsl(var(--primary))" },
    { name: "Resale Revenue", value: resaleRevenue, color: "hsl(var(--chart-2))" },
  ].filter(item => item.value > 0);

  // Calculate net revenue after royalties
  const netRevenue = totalRevenue - platformFees;

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Gross income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${platformFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((platformFees / totalRevenue) * 100).toFixed(1) : 0}% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              After fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resale Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${resaleRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((resaleRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Sources Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>
              Breakdown of revenue by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>
              Detailed revenue allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Initial Sales</div>
                  <div className="text-xs text-muted-foreground">Primary market revenue</div>
                </div>
                <div className="text-lg font-bold">${initialSalesRevenue.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Resale Revenue</div>
                  <div className="text-xs text-muted-foreground">Secondary market revenue</div>
                </div>
                <div className="text-lg font-bold">${resaleRevenue.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Platform Fees</div>
                  <div className="text-xs text-muted-foreground">Service charges</div>
                </div>
                <div className="text-lg font-bold text-destructive">-${platformFees.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2">
                <div>
                  <div className="font-bold">Net Revenue</div>
                  <div className="text-xs text-muted-foreground">Total after fees</div>
                </div>
                <div className="text-xl font-bold text-primary">${netRevenue.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
