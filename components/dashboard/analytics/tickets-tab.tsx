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

  // Fetch tickets list
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{eventId}/tickets", {
        params: { path: { eventId: eventId } },
      });
      return (response.data as any)?.tickets || [];
    },
  });

  const isLoading = distributionLoading || ticketsLoading;

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
  const tickets = ticketsData || [];

  // Prepare data for pie chart
  const distributionData = [
    { name: "Active", value: distribution.activeTickets || 0, color: STATUS_COLORS.ACTIVE },
    { name: "Used", value: distribution.usedTickets || 0, color: STATUS_COLORS.USED },
    { name: "Resold", value: distribution.resoldTickets || 0, color: STATUS_COLORS.RESOLD },
    { name: "Cancelled", value: distribution.cancelledTickets || 0, color: STATUS_COLORS.CANCELLED },
  ].filter(item => item.value > 0);

  // Filter tickets
  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ownerWallet?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Ticket Distribution Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.activeTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.usedTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resold Tickets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.resoldTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Secondary sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              of {eventData.totalTickets}
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
                  {((tickets.length / eventData.totalTickets) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Resale Rate</div>
                  <div className="text-xs text-muted-foreground">Tickets resold</div>
                </div>
                <div className="text-lg font-bold">
                  {tickets.length > 0 ? (((distribution.resoldTickets || 0) / tickets.length) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <div className="font-medium">Usage Rate</div>
                  <div className="text-xs text-muted-foreground">Tickets redeemed</div>
                </div>
                <div className="text-lg font-bold">
                  {tickets.length > 0 ? (((distribution.usedTickets || 0) / tickets.length) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2">
                <div>
                  <div className="font-bold">Available</div>
                  <div className="text-xs text-muted-foreground">Remaining tickets</div>
                </div>
                <div className="text-xl font-bold text-primary">
                  {eventData.totalTickets - tickets.length}
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
                <SelectItem value="RESOLD">Resold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {tickets.length === 0 ? "No tickets sold yet" : "No tickets match your filters"}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTickets.map((ticket: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-medium">{ticket.ticketId}</code>
                      <Badge variant={ticket.status === "ACTIVE" ? "default" : "secondary"}>
                        {ticket.status || "ACTIVE"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-3 w-3" />
                      <span className="font-mono">
                        {ticket.ownerWallet?.slice(0, 8)}...{ticket.ownerWallet?.slice(-6)}
                      </span>
                      {ticket.transactionSignature && (
                        <a 
                          href={`https://explorer.solana.com/tx/${ticket.transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View on Solana</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${ticket.ticketPrice}</div>
                    <Badge variant="outline" className="text-xs">
                      {ticket.transactionType || "INITIAL_SALE"}
                    </Badge>
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
