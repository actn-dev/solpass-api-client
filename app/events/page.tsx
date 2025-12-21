"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useMode } from "@/lib/hooks/use-mode";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { CreateEventDialog } from "@/components/create-event-dialog";

export default function EventsPage() {
  const { mode } = useMode();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: eventsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events");
      if (response.error) throw new Error("Failed to fetch events");
      return response.data as any;
    },
  });

  const events = eventsResponse?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Events</h1>
              <p className="text-muted-foreground">
                {mode === "admin" ? "Manage your events" : "Browse and buy tickets"}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Home</Button>
            </Link>
          </div>

          <ModeSwitcher />

          {mode === "admin" && (
            <div className="mb-6">
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                + Create New Event
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load events. Make sure the API server is running.
              </AlertDescription>
            </Alert>
          )}

          {events && events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No events found.</p>
                {mode === "admin" && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                    Create Your First Event
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {events && events.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: any) => (
                <Link key={event.id} href={`/events/${event.eventId}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">{event.name}</CardTitle>
                        {event.blockchainEnabled && (
                          <Badge variant="secondary">⛓️ On-chain</Badge>
                        )}
                      </div>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue:</span>
                          <span className="font-medium">{event.venue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "TBA"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">${parseFloat(event.ticketPrice || "0").toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tickets:</span>
                          <span className="font-medium">{event.totalTickets || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <CreateEventDialog 
            open={createDialogOpen} 
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              refetch();
              setCreateDialogOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
