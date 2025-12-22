"use client";

import { RecentEventsList } from "@/components/dashboard/recent-events-list";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Plus, Ticket, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  
  // Use userId from the user object
  const userId = (user as any)?.userId || user?.id;

  console.log("Dashboard - User state:", user);
  console.log("Dashboard - User ID:", userId);

  // Fetch events for this partner
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["events", userId],
    queryFn: async () => {
      console.log("Fetching events for user:", userId);
      const response = await apiClient.GET("/api/v1/events", {
        params: {
          query: {
            partnerId: userId,
          },
        },
      });
      console.log("Events response:", response.data);
      return response.data;
    },
    enabled: isAuthenticated && !!userId,
  });

  const events = (eventsData as any)?.data || [];
  const totalEvents = events.length;
  const activeEvents = events.filter((e: any) => 
    new Date(e.eventDate) > new Date()
  ).length;

  // Calculate stats
  const totalTicketsSold = events.reduce(
    (sum: number, event: any) => sum + (event.ticketsSold || 0),
    0
  );
  
  const totalRevenue = events.reduce(
    (sum: number, event: any) => 
      sum + ((event.ticketsSold || 0) * (event.ticketPrice || 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Events"
          value={totalEvents}
          icon={Calendar}
          description="Events created"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Tickets Sold"
          value={totalTicketsSold}
          icon={Ticket}
          description="Total tickets sold"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          description="USDC earned"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Active Events"
          value={activeEvents}
          icon={TrendingUp}
          description="Upcoming events"
          iconColor="text-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link href="/events">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Event on Platform
          </Button>
        </Link>
        <Link href="/dashboard/events">
          <Button size="lg" variant="outline">
            View All Events
          </Button>
        </Link>
      </div>

      {/* Recent Events */}
      <RecentEventsList events={events} isLoading={isLoading} />
    </div>
  );
}
