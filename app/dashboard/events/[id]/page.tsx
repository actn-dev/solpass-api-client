"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ExternalLink,
  Activity,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Fetch event details
  const { data: event, isLoading } = useQuery({
    queryKey: ["event-details", id],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}", {
        params: { path: { id: id as string } },
      });
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch tickets for this event
  const { data: ticketsData } = useQuery({
    queryKey: ["event-tickets", (event as any)?.eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{eventId}/tickets", {
        params: { path: { eventId: (event as any)?.eventId } },
      });
      return response.data;
    },
    enabled: !!(event as any)?.eventId && (event as any)?.blockchainEnabled,
  });

  const tickets = (ticketsData as any)?.tickets || [];
  const eventData = event as any;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Link href="/dashboard/events">
            <Button className="mt-4" variant="outline">
              Back to Events
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const ticketsSold = eventData.ticketsSold || 0;
  const ticketsAvailable = eventData.totalTickets - ticketsSold;
  const revenue = ticketsSold * eventData.ticketPrice;
  const resaleCount = tickets.filter((t: any) => t.transactionType === "RESALE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{eventData.name}</h1>
            {eventData.blockchainEnabled && (
              <Badge variant="default" className="gap-1">
                ⛓️ On Blockchain
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{eventData.description}</p>
        </div>
        <Link href={`/events/${eventData.eventId}`}>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View on Platform
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
            <p className="text-xs text-muted-foreground">
              {ticketsAvailable} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${eventData.ticketPrice} per ticket
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
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(eventData.eventDate) > new Date() ? "Active" : "Past"}
            </div>
            <p className="text-xs text-muted-foreground">
              {eventData.blockchainEnabled ? "Blockchain enabled" : "Database only"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="royalties">Royalty Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{new Date(eventData.eventDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Venue:</span>
                    <span>{eventData.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Capacity:</span>
                    <span>{eventData.totalTickets} tickets</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Ticket Price:</span>
                    <span>${eventData.ticketPrice} USDC</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span>{new Date(eventData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Event ID:</span>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {eventData.eventId}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!eventData.blockchainEnabled && (
            <Alert>
              <AlertDescription>
                This event has not been initialized on the blockchain yet.
                Initialize it from{" "}
                <Link href={`/events/${eventData.eventId}`} className="font-medium underline">
                  your platform
                </Link>
                {" "}using your API key.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {!eventData.blockchainEnabled ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Ticket data will be available after blockchain initialization
                </p>
              </CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tickets sold yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Transactions</CardTitle>
                <CardDescription>
                  {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} sold
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tickets.slice(0, 10).map((ticket: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{ticket.ticketId}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Wallet className="h-3 w-3" />
                          {ticket.ownerWallet?.slice(0, 8)}...{ticket.ownerWallet?.slice(-6)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${ticket.ticketPrice}</div>
                        <Badge variant="secondary" className="text-xs">
                          {ticket.transactionType || "INITIAL_SALE"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="royalties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Royalty Distribution</CardTitle>
              <CardDescription>
                Revenue sharing partners for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventData.royaltyDistribution && eventData.royaltyDistribution.length > 0 ? (
                <div className="space-y-3">
                  {eventData.royaltyDistribution.map((partner: any, index: number) => (
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
                          ${((revenue * partner.percentage) / 100).toFixed(2)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
