"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { TicketOffer, TicketType } from "@/app/api/ticketmaster/events/[id]/offers/route";

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

    // Fetch offers / inventory (mock Partner API)
    const [offerFilter, setOfferFilter] = useState<TicketType | "ALL">("ALL");
    const { data: offersData, isLoading: offersLoading } = useQuery({
        queryKey: ["tm-offers", tmId, tmEvent?.minPrice, tmEvent?.maxPrice],
        queryFn: async () => {
            if (!tmId) return null;
            const params = new URLSearchParams({
                minPrice: String(tmEvent?.minPrice ?? 50),
                maxPrice: String(tmEvent?.maxPrice ?? 150),
                currency: tmEvent?.currency ?? "USD",
            });
            const res = await fetch(`/api/ticketmaster/events/${tmId}/offers?${params}`);
            if (!res.ok) throw new Error("Failed to fetch offers");
            return res.json() as Promise<{ eventId: string; currency: string; source: string; offers: TicketOffer[] }>;
        },
        enabled: !!tmId && !!tmEvent,
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
                            {tmEvent?.minPrice != null && (
                                <p className="mt-2 text-lg font-semibold text-green-600">
                                    🎟 From ${tmEvent.minPrice}
                                    {tmEvent.maxPrice && tmEvent.maxPrice !== tmEvent.minPrice
                                        ? ` – $${tmEvent.maxPrice}`
                                        : ""}{" "}
                                    <span className="text-sm font-normal text-muted-foreground">{tmEvent.currency}</span>
                                </p>
                            )}
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

                    {/* Tickets & Seats */}
                    <div>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div>
                                <h2 className="text-lg font-semibold">Tickets &amp; Seats</h2>
                                <p className="text-xs text-muted-foreground">
                                    {offersData?.source === "MOCK" ? "Simulated inventory — shaped like TM Partner Offers API" : "Live inventory"}
                                </p>
                            </div>
                            {/* Type filter pills */}
                            <div className="flex gap-2 flex-wrap">
                                {(["ALL", "STANDARD", "VIP", "ACCESSIBLE", "RESALE"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setOfferFilter(t)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${offerFilter === t
                                                ? "bg-foreground text-background border-foreground"
                                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {offersLoading && (
                            <div className="flex justify-center py-12">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                            </div>
                        )}

                        {!offersLoading && offersData && (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {offersData.offers
                                    .filter((o) => offerFilter === "ALL" || o.type === offerFilter)
                                    .map((offer) => (
                                        <TicketCard key={offer.offerId} offer={offer} tmUrl={tmEvent?.url} />
                                    ))}
                            </div>
                        )}
                    </div>
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

const TYPE_STYLES: Record<TicketType, { badge: string; border: string }> = {
    STANDARD: { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", border: "border-blue-200 dark:border-blue-800" },
    VIP: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", border: "border-yellow-300 dark:border-yellow-700" },
    ACCESSIBLE: { badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", border: "border-purple-200 dark:border-purple-800" },
    RESALE: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", border: "border-orange-200 dark:border-orange-800" },
};

const TYPE_LABELS: Record<TicketType, string> = {
    STANDARD: "Standard",
    VIP: "⭐ VIP",
    ACCESSIBLE: "♿ Accessible",
    RESALE: "🔄 Resale",
};

function availabilityLabel(available: number, total: number): { text: string; color: string } {
    const pct = available / total;
    if (available <= 5) return { text: `Only ${available} left!`, color: "text-red-600" };
    if (pct < 0.15) return { text: `${available} remaining`, color: "text-orange-500" };
    if (pct < 0.40) return { text: `${available} available`, color: "text-yellow-600" };
    return { text: `${available} available`, color: "text-green-600" };
}

function TicketCard({ offer, tmUrl }: { offer: TicketOffer; tmUrl?: string }) {
    const styles = TYPE_STYLES[offer.type];
    const avail = availabilityLabel(offer.available, offer.totalCapacity);

    return (
        <div className={`rounded-xl border-2 ${styles.border} bg-card p-4 flex flex-col gap-3`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-sm leading-tight">{offer.section}</p>
                    {offer.row && (
                        <p className="text-xs text-muted-foreground mt-0.5">Row {offer.row}</p>
                    )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge} whitespace-nowrap`}>
                    {TYPE_LABELS[offer.type]}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-snug">{offer.description}</p>

            {/* Price + availability */}
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-xl font-bold">${offer.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-1">{offer.currency}</span>
                </div>
                <span className={`text-xs font-medium ${avail.color}`}>{avail.text}</span>
            </div>

            {/* Delivery methods */}
            <div className="flex gap-1 flex-wrap">
                {offer.deliveryMethods.map((d) => (
                    <span key={d} className="text-[10px] border rounded px-1.5 py-0.5 text-muted-foreground">
                        {d.replace(/_/g, " ")}
                    </span>
                ))}
            </div>

            {/* Restrictions */}
            {offer.restrictions && (
                <p className="text-[10px] text-muted-foreground italic">{offer.restrictions}</p>
            )}

            {/* CTA */}
            <a
                href={tmUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-auto"
            >
                <Button size="sm" className="w-full text-xs" variant={offer.type === "VIP" ? "default" : "outline"}>
                    {offer.type === "RESALE" ? "View Resale Listing ↗" : "Select Seats ↗"}
                </Button>
            </a>
        </div>
    );
}
