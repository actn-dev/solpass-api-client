"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Users, Search, ExternalLink, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EventsPage() {
  const { user } = useAuth();
  console.log("EventsPage - User state:", user);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch events for this partner
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["dashboard-events", user?.id],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events", {
        params: {
          query: {
            partnerId: user?.id,
          },
        },
      });
      return response.data;
    },
    enabled: !!user?.id,
  });

  const events = (eventsData as any)?.data || [];

  // Filter events based on search
  const filteredEvents = events.filter((event: any) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.eventId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your events and their performance
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          Events are created and managed on your platform at{" "}
          <Link href="/events" className="font-medium underline">
            /events
          </Link>
          {" "}using your API key. This dashboard provides monitoring and analytics.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name, venue, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/events">
          <Button className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Go to Platform
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first event on your partner platform
            </p>
            <Link href="/events">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Create Event on Platform
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                    {event.blockchainEnabled && (
                      <Badge variant="default" className="flex-shrink-0">
                        ⛓️ Live
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Tickets
                        </span>
                        <span className="font-medium">
                          {event.ticketsSold || 0}/{event.totalTickets}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Price
                        </span>
                        <span className="font-medium">${event.ticketPrice}</span>
                      </div>
                      {event.ticketsSold > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Revenue
                          </span>
                          <span className="font-medium text-green-600">
                            ${((event.ticketsSold || 0) * event.ticketPrice).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && events.length > 0 && filteredEvents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No events found matching "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
