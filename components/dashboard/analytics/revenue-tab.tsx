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
    partnerShares = [],
    platformShare = 0,
  } = data;

  // ✅ Main revenue from escrow (distributable)
  const totalDistributableRevenue = revenue.totalDistributableRevenue || revenue.escrowBalance || 0;
  
  // Breakdown from DB (for display only, not actual revenue)
  const primarySalesVolume = revenue.primarySalesVolume || 0;
  const primarySalesCount = revenue.primarySalesCount || 0;
  const resaleVolume = revenue.resaleVolume || 0;
  const resaleProfit = revenue.resaleProfit || totalDistributableRevenue;
  const resaleCount = transactions.resales || 0;

  // Partner share calculation (show first partner for now, or sum all)
  const totalPartnerShare = partnerShares.reduce((sum: number, p: any) => sum + (p.estimatedShare || 0), 0);
  const royaltyPercentage = royalties.royaltyPercentage || 0;
  
  // Distribution info
  const pendingDistribution = royalties.pendingDistribution || totalDistributableRevenue;
  const royaltiesDistributed = royalties.royaltiesDistributed || 0;

  // Prepare data for revenue source pie chart (showing profit breakdown)
  const revenueSourceData = [
    { name: "Resale Profit", value: resaleProfit, color: "hsl(var(--chart-2))" },
  ].filter((item: { name: string; value: number; color: string }) => item.value > 0);

  // If there are partner shares, show distribution breakdown (partners only - 100% split)
  const distributionData = partnerShares.length > 0 
    ? partnerShares.map((p: any, i: number) => ({
        name: `${p.partyName || `Partner ${i + 1}`} (${p.percentage}%)`,
        value: p.estimatedShare,
        color: `hsl(var(--chart-${(i % 5) + 1}))`,
      })).filter((item: { name: string; value: number; color: string }) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributable Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDistributableRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              100% from escrow (resale profits)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Share</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPartnerShare.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              100% of revenue (split by ratio)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Sales Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${primarySalesVolume.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {primarySalesCount} initial sales (not profit)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resale Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${resaleProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {resaleCount} resales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>
              100% of revenue split among partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry: { name: string; value: number; color: string }, index: number) => (
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
                No revenue distribution data available
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
                  <div className="font-medium">Primary Sales Volume</div>
                  <div className="text-xs text-muted-foreground">
                    {primarySalesCount} tickets (not profit)
                  </div>
                </div>
                <div className="text-lg text-muted-foreground">${primarySalesVolume.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Resale Volume</div>
                  <div className="text-xs text-muted-foreground">
                    {resaleCount} resales (full amounts)
                  </div>
                </div>
                <div className="text-lg text-muted-foreground">${resaleVolume.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Resale Profit</div>
                  <div className="text-xs text-muted-foreground">Profit from resales only</div>
                </div>
                <div className="text-lg font-bold text-green-600">${resaleProfit.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2">
                <div>
                  <div className="font-bold">Total Distributable Revenue (100%)</div>
                  <div className="text-xs text-muted-foreground">Full amount from blockchain escrow</div>
                </div>
                <div className="text-xl font-bold text-primary">${totalDistributableRevenue.toFixed(2)}</div>
              </div>

              <div className="flex justify-between items-center pb-2 bg-muted/50 p-3 rounded mt-4">
                <div>
                  <div className="font-medium">Partners Get (100%)</div>
                  <div className="text-xs text-muted-foreground">Full revenue split by ratio {royaltyPercentage > 0 ? `(${partnerShares.map((p: any) => `${p.partyName}: ${p.percentage}%`).join(', ')})` : ''}</div>
                </div>
                <div className="text-lg font-bold text-primary">${totalPartnerShare.toFixed(2)}</div>
              </div>

              {royaltiesDistributed > 0 && (
                <div className="flex justify-between items-center pb-2 bg-green-50 dark:bg-green-950 p-3 rounded">
                  <div>
                    <div className="font-medium">Already Distributed</div>
                    <div className="text-xs text-muted-foreground">Paid out to partners</div>
                  </div>
                  <div className="text-lg font-bold text-green-600">${royaltiesDistributed.toFixed(2)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
