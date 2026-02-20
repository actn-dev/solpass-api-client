"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function TMEventDetailPage() {
    return (
        <Suspense>
            <TMEventDetail />
        </Suspense>
    );
}

function TMEventDetail() {
    const { eventId } = useParams<{ eventId: string }>();
    const searchParams = useSearchParams();
    const tmId = searchParams.get("tmId");

    // Fetch TM event (server route keeps API key safe)
    const { data: tmEvent, isLoading: tmLoading } = useQuery({
        queryKey: ["tm-event", tmId],
        queryFn: async () => {
            if (!tmId) return null;
            const res = await fetch(`/api/ticketmaster/events/${tmId}`);
            if (!res.ok) throw new Error("Failed to fetch TM event");
            return res.json();
        },
        enabled: !!tmId,
    });

    // Fetch Solpass event
    const { data: spEvent, isLoading: spLoading } = useQuery({
        queryKey: ["sp-event", eventId],
        queryFn: async () => {
            const res = await apiClient.GET("/api/v1/events/{id}", { params: { path: { id: eventId } } });
            if (res.error) throw new Error("Failed to fetch Solpass event");
            return res.data as any;
        },
    });

    // Fetch escrow balance
    const { data: escrow } = useQuery({
        queryKey: ["escrow", eventId],
        queryFn: async () => {
            const res = await apiClient.GET("/api/v1/events/{id}/escrow" as any, { params: { path: { id: eventId } } });
            return (res.data as any) ?? null;
        },
        enabled: !!spEvent?.blockchainEnabled,
    });

    const isLoading = tmLoading || spLoading;

    return (
        <div className="min-h-screen bg-background">
            {/* TM header strip */}
            <div className="bg-[#026CDF] text-white py-3 px-6 flex items-center gap-3 text-sm">
                <span className="font-bold text-base">Ticketmaster</span>
                <span className="opacity-60">×</span>
                <span className="font-semibold">Solpass Royalty Layer</span>
                <Link href="/integrations/ticketmaster" className="ml-auto">
                    <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                        ← Back to Events
                    </Button>
                </Link>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-24">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                </div>
            )}

            {!isLoading && (
                <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">

                    {/* Hero image + title */}
                    {tmEvent?.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tmEvent.image} alt={tmEvent.name} className="w-full h-56 object-cover rounded-xl" />
                    )}

                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">{tmEvent?.name ?? spEvent?.name}</h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                {tmEvent?.venue}{tmEvent?.city ? `, ${tmEvent.city}` : ""}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {tmEvent?.genre && <Badge variant="outline">{tmEvent.genre}</Badge>}
                            {spEvent?.blockchainEnabled
                                ? <Badge className="bg-green-600 hover:bg-green-600">⛓ On-Chain</Badge>
                                : <Badge variant="secondary">Off-Chain</Badge>}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* TM Data */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Ticketmaster Data</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <Row label="Date" value={tmEvent?.date ?? "TBA"} />
                                <Row label="Time" value={tmEvent?.time ?? "TBA"} />
                                <Row label="Venue" value={tmEvent?.venue} />
                                <Row label="Address" value={tmEvent?.address} />
                                <Row label="City" value={`${tmEvent?.city ?? ""}${tmEvent?.country ? `, ${tmEvent.country}` : ""}`} />
                                <Row label="Segment" value={tmEvent?.segment} />
                                <Row label="Genre" value={tmEvent?.genre} />
                                {tmEvent?.minPrice != null && (
                                    <Row
                                        label="Face Value"
                                        value={`$${tmEvent.minPrice}${tmEvent.maxPrice && tmEvent.maxPrice !== tmEvent.minPrice ? ` – $${tmEvent.maxPrice}` : ""} ${tmEvent.currency}`}
                                    />
                                )}
                                {tmEvent?.attractions?.length > 0 && (
                                    <Row label="Artists" value={tmEvent.attractions.join(", ")} />
                                )}
                                {tmEvent?.info && <Row label="Info" value={tmEvent.info} />}
                                {tmEvent?.url && (
                                    <div className="pt-1">
                                        <a href={tmEvent.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                                            View on Ticketmaster ↗
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Solpass Data */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Solpass Event Data</CardTitle></CardHeader>
                            {spEvent ? (
                                <CardContent className="space-y-2 text-sm">
                                    <Row label="Event ID" value={spEvent.eventId} mono />
                                    <Row label="Name" value={spEvent.name} />
                                    <Row label="Venue" value={spEvent.venue} />
                                    {/* <Row label="Ticket Price" value={`$${spEvent.ticketPrice}`} /> */}
                                    {/* <Row label="Total Tickets" value={spEvent.totalTickets} /> */}
                                    <Row label="Tickets Sold" value={spEvent.ticketsSold ?? 0} />
                                    <Row label="Blockchain" value={spEvent.blockchainEnabled ? "Enabled" : "Not initialized"} />
                                    {spEvent.blockchainPDA && <Row label="PDA" value={spEvent.blockchainPDA} mono />}

                                    <hr className="my-2" />
                                    <p className="text-xs font-medium text-muted-foreground">Royalty Distribution </p>
                                    {/* {spEvent.royaltyDistribution?.map((p: any, i: number) => (
                                        <div key={i} className="text-xs flex justify-between gap-2">
                                            <span>{p.partyName}</span>
                                            <span className="text-muted-foreground">{p.percentage}%</span>
                                            <span className="font-mono truncate max-w-30 text-muted-foreground">{p.walletAddress ?? "—"}</span>
                                        </div>
                                    ))} */}

                                    {escrow != null && (
                                        <>
                                            <hr className="my-2" />
                                            <Row
                                                label="Escrow Balance"
                                                value={`${(escrow.usdcAmount / 1_000_000).toFixed(6)} USDC`}
                                            />
                                        </>
                                    )}
                                </CardContent>
                            ) : (
                                <CardContent>
                                    <Alert variant="destructive"><AlertDescription>Solpass event not found.</AlertDescription></Alert>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Seatmap */}
                    {tmEvent?.seatmap && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Seat Map</CardTitle></CardHeader>
                            <CardContent>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={tmEvent.seatmap} alt="Seat map" className="w-full rounded" />
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
    if (value == null || value === "") return null;
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{label}:</span>
            <span className={`text-right ${mono ? "font-mono text-xs break-all" : ""}`}>{String(value)}</span>
        </div>
    );
}
