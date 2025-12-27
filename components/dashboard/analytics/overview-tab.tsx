"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Users, DollarSign, TrendingUp, Activity, Calendar, MapPin, Clock, Wallet } from "lucide-react";
import Link from "next/link";

interface OverviewTabProps {
  eventId: string;
  event: any;
}

export function OverviewTab({ eventId, event }: OverviewTabProps) {
  // Fetch event statistics
  const { data: statsData } = useQuery({
    queryKey: ["event-stats", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}/stats", {
        params: { path: { id: eventId } },
      });
      return response.data;
    },
  });

  const stats = (statsData as any) || {};
  const ticketsSold = stats.ticketsSold || event.ticketsSold || 0;
  const totalRevenue = stats.totalRevenue || stats.escrowBalance || 0; // Use escrow as source of truth
  const resaleCount = stats.resaleCount || 0;
  const escrowBalance = stats.escrowBalance || 0;
  const primarySalesVolume = ticketsSold * event.ticketPrice; // For display only

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
            <p className="text-xs text-muted-foreground">
              of {event.totalTickets} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributable Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From resale profits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resaleCount}</div>
            <p className="text-xs text-muted-foreground">
              Secondary market
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${escrowBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Pending payout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{new Date(event.eventDate).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Venue:</span>
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Capacity:</span>
                <span>{event.totalTickets} tickets</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ticket Price:</span>
                <span>${event.ticketPrice} USDC</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{new Date(event.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge variant={new Date(event.eventDate) > new Date() ? "default" : "secondary"}>
                  {new Date(event.eventDate) > new Date() ? "Active" : "Past"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Event ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {event.eventId}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Royalty Partners Card */}
      <Card>
        <CardHeader>
          <CardTitle>Royalty Distribution</CardTitle>
          <CardDescription>
            Revenue sharing partners for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.royaltyDistribution && event.royaltyDistribution.length > 0 ? (
            <div className="space-y-3">
              {event.royaltyDistribution.map((partner: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{partner.partyName}</div>
                    {partner.walletAddress && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {partner.walletAddress.slice(0, 8)}...
                        {partner.walletAddress.slice(-6)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{partner.percentage}%</div>
                    <div className="text-xs text-muted-foreground">
                      ${((totalRevenue * partner.percentage) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No royalty partners configured
            </p>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Status Alert */}
      {!event.blockchainEnabled && (
        <Alert>
          <AlertDescription>
            This event has not been initialized on the blockchain yet.
            Initialize it from{" "}
            <Link href={`/events/${event.eventId}`} className="font-medium underline">
              your platform
            </Link>
            {" "}using your API key.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
