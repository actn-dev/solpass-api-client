"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Activity,
  BarChart3,
  DollarSign,
  Ticket,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { OverviewTab } from "@/components/dashboard/analytics/overview-tab";
import { AnalyticsTab } from "@/components/dashboard/analytics/analytics-tab";
import { RevenueTab } from "@/components/dashboard/analytics/revenue-tab";
import { TicketsTab } from "@/components/dashboard/analytics/tickets-tab";
import { RoyaltiesTab } from "@/components/dashboard/analytics/royalties-tab";

export default function EventDetailsPage() {
  const { id } = useParams();

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

  const eventData = event as any;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{eventData.name}</h1>
            {eventData.blockchainEnabled && (
              <Badge variant="default" className="gap-1">
                ⛓️ Blockchain
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{eventData.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {eventData.venue}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(eventData.eventDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/events">
            <Button variant="outline">← Back</Button>
          </Link>
          <Link href={`/events/${eventData.eventId}`}>
            <Button>View on Platform →</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          {eventData.blockchainEnabled && (
            <TabsTrigger value="royalties" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Royalties
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab eventId={eventData.eventId} event={eventData} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab eventId={eventData.eventId} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueTab eventId={eventData.eventId} />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <TicketsTab eventId={eventData.eventId} eventData={eventData} />
        </TabsContent>

        {eventData.blockchainEnabled && (
          <TabsContent value="royalties" className="space-y-4">
            <RoyaltiesTab eventId={eventData.eventId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
