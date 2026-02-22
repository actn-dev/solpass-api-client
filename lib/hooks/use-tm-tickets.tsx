"use client";

import { useState, useCallback, useEffect } from "react";
import type { TicketOffer, TicketType } from "@/app/api/ticketmaster/events/[id]/offers/route";

// ---------------------------------------------------------------------------
// Data shape stored in localStorage
// ---------------------------------------------------------------------------
export interface TmPurchasedTicket {
    ticketId: string;       // TM{5-event}-{8-nonce} — max 16 chars (Solana #[max_len(16)])
    tmId: string;
    offerId: string;
    section: string;
    row: string | null;
    type: TicketType;
    price: number;          // price paid
    currency: string;
    userId: string;         // current owner
    ownerWallet: string;    // current owner wallet
    originalUserId: string; // first buyer
    boughtAt: string;       // ISO timestamp
    forSale: boolean;
    resalePrice: number | null;
}

const storageKey = (tmId: string) => `tm-tickets-${tmId}`;

function loadTickets(tmId: string): TmPurchasedTicket[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(storageKey(tmId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveTickets(tmId: string, tickets: TmPurchasedTicket[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(tmId), JSON.stringify(tickets));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useTmTickets(tmId: string | null, userId: string) {
    const [tickets, setTickets] = useState<TmPurchasedTicket[]>(() =>
        tmId ? loadTickets(tmId) : []
    );

    // Re-sync when tmId changes (e.g. page hydration)
    useEffect(() => {
        if (tmId) setTickets(loadTickets(tmId));
    }, [tmId]);

    const persist = useCallback(
        (next: TmPurchasedTicket[]) => {
            if (!tmId) return;
            setTickets(next);
            saveTickets(tmId, next);
        },
        [tmId]
    );

    // ---- My tickets (current user is owner) --------------------------------
    const myTickets = tickets.filter((t) => t.userId === userId);

    // ---- Resale market (other users' tickets listed for sale) --------------
    const resaleMarket = tickets.filter((t) => t.userId !== userId && t.forSale);

    // ---- How many times a specific offer has been bought (for available count)
    const purchasedCountByOffer = tickets.reduce<Record<string, number>>((acc, t) => {
        acc[t.offerId] = (acc[t.offerId] ?? 0) + 1;
        return acc;
    }, {});

    // ---- Build a primary ticket object (does NOT persist — call persistTicket after API success)
    const buildPrimaryTicket = useCallback(
        (offer: TicketOffer, currency: string, walletAddress: string): TmPurchasedTicket => {
            // 16 chars exactly: TM(2) + evtShort(5) + dash(1) + nonce(8)
            const nonce = Date.now().toString(36).slice(-8).toUpperCase();
            const evtShort = tmId!.slice(-5).toUpperCase();
            return {
                ticketId: `TM${evtShort}-${nonce}`,
                tmId: tmId!,
                offerId: offer.offerId,
                section: offer.section,
                row: offer.row,
                type: offer.type,
                price: offer.price,
                currency,
                userId,
                ownerWallet: walletAddress,
                originalUserId: userId,
                boughtAt: new Date().toISOString(),
                forSale: false,
                resalePrice: null,
            };
        },
        [tmId, userId]
    );

    // ---- Persist a ticket to localStorage (call only after API success) ----
    const persistTicket = useCallback(
        (ticket: TmPurchasedTicket) => {
            persist([...tickets, ticket]);
        },
        [tickets, persist]
    );

    // ---- Apply resale purchase in localStorage (call after API success) ----
    const applyResalePurchase = useCallback(
        (ticketId: string, newOwnerUserId: string, newOwnerWallet: string, pricePaid: number) => {
            const next = tickets.map((t) =>
                t.ticketId === ticketId
                    ? { ...t, userId: newOwnerUserId, ownerWallet: newOwnerWallet, price: pricePaid, forSale: false, resalePrice: null }
                    : t
            );
            persist(next);
        },
        [tickets, persist]
    );

    // ---- List a ticket for resale ------------------------------------------
    const listForResale = useCallback(
        (ticketId: string, resalePrice: number) => {
            const next = tickets.map((t) =>
                t.ticketId === ticketId ? { ...t, forSale: true, resalePrice } : t
            );
            persist(next);
        },
        [tickets, persist]
    );

    // ---- Cancel resale listing ---------------------------------------------
    const cancelResale = useCallback(
        (ticketId: string) => {
            const next = tickets.map((t) =>
                t.ticketId === ticketId ? { ...t, forSale: false, resalePrice: null } : t
            );
            persist(next);
        },
        [tickets, persist]
    );

    return {
        allTickets: tickets,
        myTickets,
        resaleMarket,
        purchasedCountByOffer,
        buildPrimaryTicket,
        persistTicket,
        applyResalePurchase,
        listForResale,
        cancelResale,
    };
}
