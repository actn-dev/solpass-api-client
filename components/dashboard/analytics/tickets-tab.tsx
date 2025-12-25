"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Ticket, Users, Wallet, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TicketsTabProps {
  eventId: string;
  eventData: any;
}

const STATUS_COLORS = {
  ACTIVE: "hsl(var(--chart-1))",
  USED: "hsl(var(--chart-2))",
  RESOLD: "hsl(var(--chart-3))",
  CANCELLED: "hsl(var(--chart-4))",
};

export function TicketsTab({ eventId, eventData }: TicketsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch ticket distribution
  const { data: ticketDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ["event-ticket-distribution", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}/analytics/tickets", {
        params: { path: { id: eventId } },
      });
      return response.data;
    },
  });

  // Fetch all transactions for the event
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["event-transactions", eventId],
    queryFn: async () => {
      console.log("Fetching transactions for eventId:", eventId);
      const response = await apiClient.GET("/api/v1/events/{id}/transactions", {
        params: { path: { id: eventId } },
      });
      console.log("Transactions response:", response.data);
      return (response.data as any)?.transactions || [];
    },
  });

  const isLoading = distributionLoading || transactionsLoading;

  if (transactionsError) {
    console.error("Error fetching transactions:", transactionsError);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-muted-foreground">Loading ticket data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!eventData.blockchainEnabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Ticket data will be available after blockchain initialization
          </p>
        </CardContent>
      </Card>
    );
  }

  const distribution = (ticketDistribution as any) || {};
  const transactions = transactionsData || [];

  console.log("Distribution data:", distribution);
  console.log("Transactions data:", transactions);
  console.log("Transactions length:", transactions.length);

  // Prepare data for pie chart
  const distributionData = [
    { name: "Active", value: distribution.byStatus?.active || 0, color: STATUS_COLORS.ACTIVE },
    { name: "Used", value: distribution.byStatus?.used || 0, color: STATUS_COLORS.USED },
    { name: "Cancelled", value: distribution.byStatus?.cancelled || 0, color: STATUS_COLORS.CANCELLED },
  ].filter(item => item.value > 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx: any) => {
    const matchesSearch = tx.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.toOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.fromOwner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "PURCHASE" && tx.transactionType === "purchase") ||
                         (statusFilter === "RESELL" && tx.transactionType === "resell");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Ticket Distribution Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.summary?.ticketsSold || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {eventData.totalTickets} tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.byStatus?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resale Count</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.byResellCount?.resoldOnce || 0}</div>
            <p className="text-xs text-muted-foreground">
              Resold at least once
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All buys & resells
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ticket Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>
              Breakdown by ticket status
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
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} tickets`, "Count"]}
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
                No tickets sold yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Metrics</CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Sell-Through Rate</div>
                  <div className="text-xs text-muted-foreground">Tickets sold vs capacity</div>
                </div>
                <div className="text-lg font-bold">
                  {(((distribution.summary?.ticketsSold || 0) / eventData.totalTickets) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Resale Rate</div>
                  <div className="text-xs text-muted-foreground">Tickets resold at least once</div>
                </div>
                <div className="text-lg font-bold">
                  {(distribution.summary?.ticketsSold || 0) > 0 ? (((distribution.byResellCount?.resoldOnce || 0) / (distribution.summary?.ticketsSold || 1)) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Usage Rate</div>
                  <div className="text-xs text-muted-foreground">Tickets redeemed</div>
                </div>
                <div className="text-lg font-bold">
                  {(distribution.summary?.ticketsSold || 0) > 0 ? (((distribution.byStatus?.used || 0) / (distribution.summary?.ticketsSold || 1)) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2">
                <div>
                  <div className="font-bold">Available</div>
                  <div className="text-xs text-muted-foreground">Remaining tickets</div>
                </div>
                <div className="text-xl font-bold text-primary">
                  {eventData.totalTickets - (distribution.summary?.ticketsSold || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Transactions</CardTitle>
          <CardDescription>
            All ticket purchases and transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by ticket ID or wallet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE">Initial Purchase</SelectItem>
                <SelectItem value="RESELL">Resale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTransactions.map((tx: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-medium">{tx.ticketId}</code>
                      <Badge variant={tx.transactionType === "purchase" ? "default" : "secondary"}>
                        {tx.transactionType === "purchase" ? "INITIAL SALE" : "RESALE"}
                      </Badge>
                      {tx.status && (
                        <Badge variant="outline" className="text-xs">
                          {tx.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        {tx.fromOwner ? (
                          <>
                            <span className="font-mono">
                              {tx.fromOwner.slice(0, 8)}...{tx.fromOwner.slice(-6)}
                            </span>
                            <span>→</span>
                          </>
                        ) : (
                          <span className="text-xs">Initial Sale →</span>
                        )}
                        <Wallet className="h-3 w-3" />
                        <span className="font-mono">
                          {tx.toOwner.slice(0, 8)}...{tx.toOwner.slice(-6)}
                        </span>
                      </div>
                      {tx.blockchainTxHash && (
                        <a 
                          href={`https://explorer.solana.com/tx/${tx.blockchainTxHash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View on Solana</span>
                        </a>
                      )}
                      <div className="text-xs">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-lg">${tx.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
