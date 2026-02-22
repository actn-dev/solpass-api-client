import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock Ticketmaster Offers / Inventory API
// Shaped after the real TM Partner Offers API response.
// Swap the mock generator below with a real HTTP call when you have access.
// ---------------------------------------------------------------------------

export type TicketType = "STANDARD" | "VIP" | "RESALE" | "ACCESSIBLE";

export interface TicketOffer {
    offerId: string;
    section: string;
    row: string | null;
    type: TicketType;
    description: string;
    price: number;
    currency: string;
    available: number;
    totalCapacity: number;
    deliveryMethods: string[];
    restrictions: string | null;
}

/** Seeded pseudo-random — same event always gets same sections. */
function seededRand(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 4294967296;
    };
}

function hashStr(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function generateMockOffers(
    eventId: string,
    minPrice: number,
    maxPrice: number,
    currency: string,
): TicketOffer[] {
    const rand = seededRand(hashStr(eventId));
    const spread = maxPrice - minPrice || minPrice * 0.4;

    const sections: Array<{
        section: string;
        row: string | null;
        type: TicketType;
        description: string;
        priceFactor: number; // multiplier applied to base price
        capacityBase: number;
    }> = [
        // Floor / GA
        { section: "Floor A", row: null, type: "STANDARD", description: "General Admission – Floor, unreserved standing area closest to stage", priceFactor: 1.0, capacityBase: 300 },
        { section: "Floor B", row: null, type: "STANDARD", description: "General Admission – Floor, secondary standing zone", priceFactor: 0.95, capacityBase: 250 },
        // Lower bowl
        { section: "Section 101", row: "A–M", type: "STANDARD", description: "Lower Bowl – best unobstructed sightlines, centre-stage", priceFactor: 0.85, capacityBase: 120 },
        { section: "Section 102", row: "A–J", type: "STANDARD", description: "Lower Bowl – left side, excellent angle", priceFactor: 0.80, capacityBase: 100 },
        { section: "Section 103", row: "A–J", type: "STANDARD", description: "Lower Bowl – right side, excellent angle", priceFactor: 0.80, capacityBase: 100 },
        { section: "Section 104", row: "A–H", type: "STANDARD", description: "Lower Bowl – side section", priceFactor: 0.70, capacityBase: 80 },
        // Upper bowl
        { section: "Section 201", row: "A–F", type: "STANDARD", description: "Upper Bowl – centre view, affordable option", priceFactor: 0.55, capacityBase: 90 },
        { section: "Section 202", row: "A–E", type: "STANDARD", description: "Upper Bowl – left side", priceFactor: 0.50, capacityBase: 70 },
        { section: "Section 203", row: "A–E", type: "STANDARD", description: "Upper Bowl – right side", priceFactor: 0.50, capacityBase: 70 },
        // VIP
        { section: "VIP Floor", row: "VIP1–VIP3", type: "VIP", description: "VIP Package – premium floor access, meet-and-greet eligibility, lounge entry", priceFactor: 2.8, capacityBase: 40 },
        { section: "VIP Lounge Box", row: "Box A", type: "VIP", description: "VIP Private Box – dedicated host, premium seating, complimentary drinks", priceFactor: 3.5, capacityBase: 16 },
        // Accessible
        { section: "Accessible Sec. 101", row: "ADA1", type: "ACCESSIBLE", description: "ADA-compliant seating – companion seats included, accessible entry", priceFactor: 0.85, capacityBase: 20 },
        { section: "Accessible Floor", row: "ADA-F", type: "ACCESSIBLE", description: "ADA viewing platform – floor level, rail support", priceFactor: 1.0, capacityBase: 12 },
        // Resale
        { section: "Resale – Floor A", row: null, type: "RESALE", description: "Fan resale listing – Floor GA, verified by Ticketmaster", priceFactor: 1.35, capacityBase: 15 },
        { section: "Resale – Sec. 101", row: "C", type: "RESALE", description: "Fan resale listing – Lower Bowl, Row C centre", priceFactor: 1.2, capacityBase: 8 },
        { section: "Resale – VIP Floor", row: "VIP2", type: "RESALE", description: "Fan resale – VIP Floor access (limited)", priceFactor: 3.1, capacityBase: 4 },
    ];

    return sections.map((s, idx) => {
        const r = rand();
        const basePrice = minPrice + spread * (s.priceFactor - 0.5);
        const jitter = (rand() - 0.5) * spread * 0.08;
        const price = round2(Math.max(minPrice * 0.4, basePrice + jitter));

        const totalCapacity = Math.floor(s.capacityBase * (0.8 + rand() * 0.4));
        const soldFraction = 0.2 + r * 0.75; // 20–95 % sold
        const available = Math.max(1, Math.floor(totalCapacity * (1 - soldFraction)));

        const deliveryMethods = ["MOBILE_TRANSFER"];
        if (s.type !== "RESALE") deliveryMethods.push("PRINT_AT_HOME");
        if (s.type === "VIP") deliveryMethods.push("WILL_CALL");

        return {
            offerId: `${eventId}-offer-${idx + 1}`,
            section: s.section,
            row: s.row,
            type: s.type,
            description: s.description,
            price,
            currency,
            available,
            totalCapacity,
            deliveryMethods,
            restrictions: s.type === "ACCESSIBLE" ? "Valid disability documentation may be required" : null,
        };
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const minPrice = parseFloat(searchParams.get("minPrice") ?? "50");
    const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "150");
    const currency = searchParams.get("currency") ?? "USD";

    const offers = generateMockOffers(id, minPrice, maxPrice, currency);

    return NextResponse.json({
        eventId: id,
        currency,
        source: "MOCK", // flip to "LIVE" when real API is wired
        offers,
    });
}
