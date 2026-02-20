"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface TMEvent {
    id: string;
    name: string;
    url: string;
    date: string | null;
    time: string | null;
    image: string | null;
    venue: string;
    city: string;
    minPrice: number | null;
    maxPrice: number | null;
    genre: string | null;
}

export default function TicketmasterEventsPage() {
    const [keyword, setKeyword] = useState("concert");
    const [search, setSearch] = useState("concert");

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["tm-events", search],
        queryFn: async () => {
            const res = await fetch(`/api/ticketmaster/events?keyword=${encodeURIComponent(search)}&size=12`);
            if (!res.ok) throw new Error("Failed to fetch Ticketmaster events");
            return res.json() as Promise<{ events: TMEvent[]; total: number }>;
        },
    });

    const events = data?.events ?? [];

    return (
        <div className="min-h-screen bg-background">
            {/* TM Integration header strip */}
            <div className="bg-[#026CDF] text-white py-3 px-6 flex items-center gap-3 text-sm">
                <span className="font-bold text-base">Ticketmaster</span>
                <span className="opacity-60">×</span>
                <span className="font-semibold">Solpass Royalty Layer</span>
                <Badge className="ml-auto bg-white text-[#026CDF] hover:bg-white">Integration Demo</Badge>
            </div>

            <div className="container mx-auto py-8 px-4 max-w-6xl">
                {/* Page header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Ticketmaster Events</h1>
                        <p className="text-muted-foreground text-sm">
                            Live data from Ticketmaster Discovery API. Select an event to enable Solpass royalties on resale.
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm">← Dashboard</Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex gap-2 mb-6 max-w-md">
                    <Input
                        placeholder="Search events (e.g. Taylor Swift, NBA...)"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && setSearch(keyword)}
                    />
                    <Button onClick={() => setSearch(keyword)} variant="secondary">Search</Button>
                </div>

                {/* States */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                        <p className="mt-4 text-muted-foreground">Fetching from Ticketmaster...</p>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>Failed to load Ticketmaster events. Check TM_CONSUMER_KEY.</AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && events.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No events found for &quot;{search}&quot;.
                        </CardContent>
                    </Card>
                )}

                {/* Events grid */}
                {events.length > 0 && (
                    <>
                        <p className="text-xs text-muted-foreground mb-4">
                            Showing {events.length} of {data?.total?.toLocaleString()} results
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    {event.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={event.image}
                                            alt={event.name}
                                            className="w-full h-40 object-cover"
                                        />
                                    )}
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-base leading-tight">{event.name}</CardTitle>
                                            {event.genre && (
                                                <Badge variant="outline" className="text-xs shrink-0">{event.genre}</Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs">
                                            {event.venue}{event.city ? `, ${event.city}` : ""}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-1 text-sm mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date:</span>
                                                <span>{event.date ?? "TBA"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Price:</span>
                                                <span>
                                                    {event.minPrice != null
                                                        ? `$${event.minPrice}${event.maxPrice && event.maxPrice !== event.minPrice ? ` – $${event.maxPrice}` : ""}`
                                                        : "See site"}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Next step placeholder — will wire up in resale step */}
                                        <Button size="sm" className="w-full" disabled>
                                            Enable Solpass Royalties
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
