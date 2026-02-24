"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMode } from "@/lib/hooks/use-mode";
import { usePlatform } from "@/lib/hooks/use-platform";
import { useTmTickets, type TmPurchasedTicket } from "@/lib/hooks/use-tm-tickets";
import { UserAvatarSwitcher } from "@/components/platform/user-avatar-switcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { TicketOffer, TicketType } from "@/app/api/ticketmaster/events/[id]/offers/route";
import { EnableRoyaltiesDialog } from "@/components/enable-royalties-dialog";

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

    const queryClient = useQueryClient();

    const { mode, getUserId, getWalletAddress } = useMode();
    const userId = getUserId();
    const { isConfigured, setApiKey } = usePlatform();
    const { getApiKey, isAuthenticated } = useAuth();

    // ── Auto-configure API key on mount ──────────────────────────────────────
    const [configError, setConfigError] = useState(false);
    useEffect(() => {
        if (isConfigured || !isAuthenticated) return;
        getApiKey()
            .then((key) => { setApiKey(key); setConfigError(false); })
            .catch(() => setConfigError(true));
    }, [isAuthenticated, isConfigured]);

    // ── Chain gate state ──────────────────────────────────────────────────────
    const [enableDialogOpen, setEnableDialogOpen] = useState(false);

    // ── Buy error banner ─────────────────────────────────────────────────────
    const [buyError, setBuyError] = useState<string | null>(null);

    // ── Resale dialog state ──────────────────────────────────────────────────
    const [resaleDialogOpen, setResaleDialogOpen] = useState(false);
    const [resaleTicket, setResaleTicket] = useState<TmPurchasedTicket | null>(null);
    const [resalePriceInput, setResalePriceInput] = useState("");

    // ── Filter state ─────────────────────────────────────────────────────────
    const [offerFilter, setOfferFilter] = useState<TicketType | "ALL">("ALL");

    // ── Per-card pending state ────────────────────────────────────────────────
    const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
    const [pendingResaleId, setPendingResaleId] = useState<string | null>(null);

    // ── Remote data ──────────────────────────────────────────────────────────
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

    const { data: spEvent, isLoading: spLoading } = useQuery({
        queryKey: ["sp-event", eventId],
        queryFn: async () => {
            const res = await apiClient.GET("/api/v1/events/{id}", { params: { path: { id: eventId } } });
            if (res.error) throw new Error("Failed to fetch Solpass event");
            return res.data as any;
        },
    });

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

    const { data: escrow } = useQuery({
        queryKey: ["escrow", eventId],
        queryFn: async () => {
            const res = await apiClient.GET("/api/v1/events/{id}/escrow" as any, { params: { path: { id: eventId } } });
            return (res.data as any) ?? null;
        },
        enabled: !!spEvent?.blockchainEnabled,
    });

    const { data: approvalStatus } = useQuery({
        queryKey: ["approval-status", spEvent?.eventId],
        queryFn: async () => {
            const res = await fetch(`/api/solpass/approval-status?eventId=${spEvent!.eventId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to fetch approval status");
            return data;
        },
        enabled: !!spEvent?.blockchainEnabled && !!spEvent?.eventId,
    });

    // ── Ticket simulation (localStorage) ────────────────────────────────────
    const {
        myTickets,
        resaleMarket,
        purchasedCountByOffer,
        buildPrimaryTicket,
        persistTicket,
        applyResalePurchase,
        listForResale,
        cancelResale,
    } = useTmTickets(tmId, userId);

    // ── Primary purchase mutation (real API → localStorage on success) ───────
    const primaryMutation = useMutation({
        mutationFn: async (offer: TicketOffer) => {
            if (!spEvent?.eventId) throw new Error("Solpass event not linked");
            if (!isConfigured) throw new Error("API key not configured — go to Dashboard → Settings");

            const ticket = buildPrimaryTicket(offer, offersData?.currency ?? "USD", getWalletAddress());

            const res = await apiClient.POST("/api/v1/events/{eventId}/tickets", {
                params: { path: { eventId: spEvent.eventId } },
                body: {
                    ticketId: ticket.ticketId,
                    buyerWallet: ticket.ownerWallet,
                    sellerWallet: "TMPlatformWallet111111111111111111111111111",
                    newPrice: ticket.price,
                    originalPrice: ticket.price,
                    buyerId: userId,
                    sellerId: "tm-platform",
                },
            });
            if (res.error) throw new Error((res.error as any)?.message ?? "Purchase failed");
            return ticket; // return the built ticket on success
        },
        onSuccess: (ticket) => {
            setBuyError(null);
            persistTicket(ticket);
        },
        onError: (err: Error) => {
            setBuyError(err.message);
        },
    });

    // ── Resale purchase mutation (real API → localStorage on success) ────────
    const resaleMutation = useMutation({
        mutationFn: async (ticket: TmPurchasedTicket) => {
            if (!spEvent?.eventId) throw new Error("Solpass event not linked");
            if (!isConfigured) throw new Error("API key not configured — go to Dashboard → Settings");

            const pricePaid = ticket.resalePrice ?? ticket.price;

            const res = await apiClient.POST("/api/v1/events/{eventId}/tickets", {
                params: { path: { eventId: spEvent.eventId } },
                body: {
                    ticketId: ticket.ticketId,
                    buyerWallet: getWalletAddress(),
                    sellerWallet: ticket.ownerWallet,
                    newPrice: pricePaid,
                    originalPrice: ticket.price,
                    buyerId: userId,
                    sellerId: ticket.userId,
                },
            });
            if (res.error) throw new Error((res.error as any)?.message ?? "Resale purchase failed");
            return { ticket, pricePaid };
        },
        onSuccess: ({ ticket, pricePaid }) => {
            setBuyError(null);
            applyResalePurchase(ticket.ticketId, userId, getWalletAddress(), pricePaid);
        },
        onError: (err: Error) => {
            setBuyError(err.message);
        },
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleBuyPrimary = (offer: TicketOffer) => {
        if (tradingLocked) return;
        setBuyError(null);
        setPendingOfferId(offer.offerId);
        primaryMutation.mutate(offer, { onSettled: () => setPendingOfferId(null) });
    };

    const handleBuyResale = (ticket: TmPurchasedTicket) => {
        if (tradingLocked) return;
        setBuyError(null);
        setPendingResaleId(ticket.ticketId);
        resaleMutation.mutate(ticket, { onSettled: () => setPendingResaleId(null) });
    };

    const openResaleDialog = (ticket: TmPurchasedTicket) => {
        setResaleTicket(ticket);
        setResalePriceInput((ticket.price * 1.2).toFixed(2));
        setResaleDialogOpen(true);
    };

    const handleConfirmResale = () => {
        if (!resaleTicket) return;
        const price = parseFloat(resalePriceInput);
        if (isNaN(price) || price <= 0) return;
        listForResale(resaleTicket.ticketId, price);
        setResaleDialogOpen(false);
    };

    const isLoading = tmLoading || spLoading;
    const currency = offersData?.currency ?? tmEvent?.currency ?? "USD";

    // ── Chain-readiness gate ──────────────────────────────────────────────────
    // true only once the event is on-chain (blockchainEnabled) AND the USDC
    // partner accounts have been set up (escrow is returned by the API).
    const chainReady = !!spEvent?.blockchainEnabled;

    // true when royalties have already been distributed on-chain
    const royaltiesDistributed = !!approvalStatus?.royaltyDistributed;

    // buying/reselling is locked when admin OR royalties already paid out
    const tradingLocked = mode === "admin" || royaltiesDistributed;

    // Auto-open the enable dialog when the event is loaded but not yet on-chain
    useEffect(() => {
        if (!isLoading && spEvent && !spEvent.blockchainEnabled) {
            setEnableDialogOpen(true);
        }
    }, [isLoading, spEvent]);

    // Shape the tmEvent into what EnableRoyaltiesDialog expects
    const dialogTmEvent = tmEvent
        ? {
            id: tmId ?? (tmEvent as any).id ?? "",
            name: tmEvent.name ?? "",
            venue: tmEvent.venue ?? "",
            city: tmEvent.city ?? "",
            date: tmEvent.date ?? null,
            minPrice: tmEvent.minPrice ?? null,
            genre: tmEvent.genre ?? null,
        }
        : null;

    // Adjust available count per offer by subtracting local purchases
    const adjustedOffers = (offersData?.offers ?? []).map((o) => ({
        ...o,
        available: Math.max(0, o.available - (purchasedCountByOffer[o.offerId] ?? 0)),
    }));

    return (
        <div className="min-h-screen bg-background">
            {/* TM header strip */}
            <div className="bg-[#026CDF] text-white py-3 px-6 flex items-center gap-3 text-sm">
                <span className="font-bold text-base">Ticketmaster</span>
                <span className="opacity-60">×</span>
                <span className="font-semibold">Solpass Layer</span>
                <div className="ml-auto flex items-center gap-2">
                    {spEvent?.eventId && (
                        <Link href={`/dashboard/events/${spEvent.eventId}`}>
                            <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                                Admin Dashboard ↗
                            </Button>
                        </Link>
                    )}
                    <Link href="/integrations/ticketmaster">
                        <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                            ← Back to Events
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-24">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                </div>
            )}

            {!isLoading && (
                <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">

                    {/* Buy error banner */}
                    {buyError && (
                        <Alert variant="destructive">
                            <AlertDescription className="flex items-center justify-between gap-2">
                                <span>{buyError}</span>
                                <button onClick={() => setBuyError(null)} className="text-xs underline shrink-0">Dismiss</button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* API key config error banner */}
                    {configError && (
                        <Alert variant="destructive">
                            <AlertDescription className="flex items-center justify-between gap-2">
                                <span>Could not auto-configure API key.</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={() =>
                                        getApiKey()
                                            .then((key) => { setApiKey(key); setConfigError(false); })
                                            .catch(() => setConfigError(true))
                                    }
                                >
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

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

                    {/* Event info cards */}
                    <div className="grid md:grid-cols-2 gap-6">
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
                                    <Row label="Face Value" value={`$${tmEvent.minPrice}${tmEvent.maxPrice && tmEvent.maxPrice !== tmEvent.minPrice ? ` – $${tmEvent.maxPrice}` : ""} ${tmEvent.currency}`} />
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

                        <Card>
                            <CardHeader><CardTitle className="text-base">Solpass Event Data</CardTitle></CardHeader>
                            {spEvent ? (
                                <CardContent className="space-y-2 text-sm">
                                    <Row label="Event ID" value={spEvent.eventId} mono />
                                    <Row label="Name" value={spEvent.name} />
                                    <Row label="Venue" value={spEvent.venue} />
                                    <Row label="Tickets Sold" value={spEvent.ticketsSold ?? 0} />
                                    <Row label="Blockchain" value={spEvent.blockchainEnabled ? "Enabled" : "Not initialized"} />
                                    {spEvent.blockchainPDA && <Row label="PDA" value={spEvent.blockchainPDA} mono />}
                                    {escrow != null && (
                                        <>
                                            <hr className="my-2" />
                                            <Row label="Escrow Balance" value={`${(escrow.usdcAmount / 1_000_000).toFixed(6)} USDC`} />
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

                    {/* ── CHAIN GATE ─────────────────────────────────────────────── */}
                    {!chainReady ? (
                        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-10 text-center space-y-4">
                            <div className="text-5xl">⛓</div>
                            <h3 className="text-lg font-semibold">Blockchain not initialized</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                This event has not been enabled on-chain yet. Ticket purchases and resales
                                require Solpass royalty enforcement to be active.
                            </p>
                            <Button onClick={() => setEnableDialogOpen(true)}>
                                Enable Solpass on this Event
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* ── ROYALTIES DISTRIBUTED BANNER ──────────────────────────── */}
                            {royaltiesDistributed && (
                                <Alert className="border-green-500/40 bg-green-500/5">
                                    <AlertDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <span className="text-lg">✅</span>
                                        <span>
                                            Royalties have been distributed on-chain for this event.
                                            Ticket purchases and resales are no longer available.
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* ── MY TICKETS ─────────────────────────────────────────────── */}
                            {myTickets.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">🎫 My Tickets</h2>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {myTickets.map((ticket) => (
                                            <MyTicketCard
                                                key={ticket.ticketId}
                                                ticket={ticket}
                                                onResell={() => openResaleDialog(ticket)}
                                                onCancelResale={() => cancelResale(ticket.ticketId)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── RESALE MARKET ──────────────────────────────────────────── */}
                            {resaleMarket.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">🔄 Resale Market</h2>
                                    <p className="text-xs text-muted-foreground mb-3">Tickets listed for resale by other fans</p>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {resaleMarket.map((ticket) => (
                                            <ResaleCard
                                                key={ticket.ticketId}
                                                ticket={ticket}
                                                isAdmin={tradingLocked}
                                                isPending={pendingResaleId === ticket.ticketId}
                                                onBuy={() => handleBuyResale(ticket)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── PRIMARY INVENTORY ──────────────────────────────────────── */}
                            <div>
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <div>
                                        <h2 className="text-lg font-semibold">🎟 Tickets &amp; Seats</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {offersData?.source === "MOCK"
                                                ? "Simulated inventory — shaped like TM Partner Offers API"
                                                : "Live inventory"}
                                        </p>
                                    </div>
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
                                        {adjustedOffers
                                            .filter((o) => offerFilter === "ALL" || o.type === offerFilter)
                                            .map((offer) => (
                                                <TicketCard
                                                    key={offer.offerId}
                                                    offer={offer}
                                                    currency={currency}
                                                    isAdmin={tradingLocked}
                                                    isPending={pendingOfferId === offer.offerId}
                                                    onBuy={() => handleBuyPrimary(offer)}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── FLOATING USER SWITCHER ────────────────────────────────────── */}
            <div className="fixed bottom-4 right-4 z-50">
                <UserAvatarSwitcher />
            </div>

            {/* ── ENABLE SOLPASS DIALOG ─────────────────────────────────────── */}
            <EnableRoyaltiesDialog
                tmEvent={dialogTmEvent}
                open={enableDialogOpen}
                onOpenChange={setEnableDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["sp-event", eventId] });
                    setEnableDialogOpen(false);
                }}
            />

            {/* ── RESALE DIALOG ──────────────────────────────────────────────── */}
            <Dialog open={resaleDialogOpen} onOpenChange={setResaleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>List Ticket for Resale</DialogTitle>
                        <DialogDescription>
                            Set a resale price for ticket{" "}
                            <span className="font-mono text-xs">{resaleTicket?.ticketId}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Section</span>
                                <span className="font-medium">{resaleTicket?.section}</span>
                            </div>
                            {resaleTicket?.row && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Row</span>
                                    <span className="font-medium">{resaleTicket.row}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-medium">${resaleTicket?.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="resalePrice">Resale Price ({currency})</Label>
                            <Input
                                id="resalePrice"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={resalePriceInput}
                                onChange={(e) => setResalePriceInput(e.target.value)}
                                placeholder="120.00"
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Royalties apply on resale via Solpass on-chain enforcement.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResaleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmResale}>List for Resale</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
    if (available === 0) return { text: "Sold out", color: "text-red-500" };
    if (available <= 5) return { text: `Only ${available} left!`, color: "text-red-600" };
    const pct = available / total;
    if (pct < 0.15) return { text: `${available} remaining`, color: "text-orange-500" };
    if (pct < 0.40) return { text: `${available} available`, color: "text-yellow-600" };
    return { text: `${available} available`, color: "text-green-600" };
}

function TicketCard({
    offer,
    currency,
    isAdmin,
    isPending,
    onBuy,
}: {
    offer: TicketOffer & { available: number };
    currency: string;
    isAdmin: boolean;
    isPending: boolean;
    onBuy: () => void;
}) {
    const styles = TYPE_STYLES[offer.type];
    const avail = availabilityLabel(offer.available, offer.totalCapacity);
    const soldOut = offer.available === 0;

    return (
        <div className={`rounded-xl border-2 ${styles.border} bg-card p-4 flex flex-col gap-3 ${soldOut ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-sm leading-tight">{offer.section}</p>
                    {offer.row && <p className="text-xs text-muted-foreground mt-0.5">Row {offer.row}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge} whitespace-nowrap`}>
                    {TYPE_LABELS[offer.type]}
                </span>
            </div>

            <p className="text-xs text-muted-foreground leading-snug">{offer.description}</p>

            <div className="flex items-end justify-between">
                <div>
                    <span className="text-xl font-bold">${offer.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-1">{currency}</span>
                </div>
                <span className={`text-xs font-medium ${avail.color}`}>{avail.text}</span>
            </div>

            <div className="flex gap-1 flex-wrap">
                {offer.deliveryMethods.map((d) => (
                    <span key={d} className="text-[10px] border rounded px-1.5 py-0.5 text-muted-foreground">
                        {d.replace(/_/g, " ")}
                    </span>
                ))}
            </div>

            {offer.restrictions && (
                <p className="text-[10px] text-muted-foreground italic">{offer.restrictions}</p>
            )}

            <Button
                size="sm"
                className="mt-auto w-full text-xs"
                variant={offer.type === "VIP" ? "default" : "outline"}
                disabled={isAdmin || soldOut || isPending}
                onClick={onBuy}
            >
                {isAdmin ? "Admin View Only" : soldOut ? "Sold Out" : isPending ? "Processing..." : "Buy Ticket"}
            </Button>
        </div>
    );
}

function MyTicketCard({
    ticket,
    onResell,
    onCancelResale,
}: {
    ticket: TmPurchasedTicket;
    onResell: () => void;
    onCancelResale: () => void;
}) {
    const styles = TYPE_STYLES[ticket.type];
    return (
        <div className={`rounded-xl border-2 ${styles.border} bg-card p-4 flex flex-col gap-2`}>
            <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{ticket.section}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge} whitespace-nowrap`}>
                    {TYPE_LABELS[ticket.type]}
                </span>
            </div>
            {ticket.row && <p className="text-xs text-muted-foreground">Row {ticket.row}</p>}

            <p className="font-mono text-[10px] text-muted-foreground break-all">{ticket.ticketId}</p>

            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold">${ticket.price.toFixed(2)} {ticket.currency}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Bought</span>
                    <span>{new Date(ticket.boughtAt).toLocaleString()}</span>
                </div>
            </div>

            {ticket.forSale && ticket.resalePrice != null && (
                <div className="rounded bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-2 text-xs flex justify-between items-center">
                    <span className="text-orange-700 dark:text-orange-300 font-medium">Listed for resale</span>
                    <span className="font-bold text-orange-800 dark:text-orange-200">${ticket.resalePrice.toFixed(2)}</span>
                </div>
            )}

            {!ticket.forSale ? (
                <Button size="sm" variant="outline" className="w-full text-xs mt-auto" onClick={onResell}>
                    List for Resale
                </Button>
            ) : (
                <Button size="sm" variant="ghost" className="w-full text-xs mt-auto text-muted-foreground" onClick={onCancelResale}>
                    Cancel Listing
                </Button>
            )}
        </div>
    );
}

function ResaleCard({
    ticket,
    isAdmin,
    isPending,
    onBuy,
}: {
    ticket: TmPurchasedTicket;
    isAdmin: boolean;
    isPending: boolean;
    onBuy: () => void;
}) {
    const styles = TYPE_STYLES[ticket.type];
    return (
        <div className={`rounded-xl border-2 ${styles.border} bg-card p-4 flex flex-col gap-2`}>
            <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{ticket.section}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 whitespace-nowrap">
                    🔄 Resale
                </span>
            </div>
            {ticket.row && <p className="text-xs text-muted-foreground">Row {ticket.row}</p>}

            <div className="text-xs space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Resale price</span>
                    <span className="text-lg font-bold">${ticket.resalePrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Original type</span>
                    <span>{TYPE_LABELS[ticket.type]}</span>
                </div>
            </div>

            <Button
                size="sm"
                className="w-full text-xs mt-auto"
                disabled={isAdmin || isPending}
                onClick={onBuy}
            >
                {isAdmin ? "Admin View Only" : isPending ? "Processing..." : "Buy Resale Ticket"}
            </Button>
        </div>
    );
}
