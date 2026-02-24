import { NextRequest, NextResponse } from "next/server";

const SOLPASS_API = process.env.SOLPASS_API_URL ?? "https://api.solpass.app";

async function solpassFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(`${SOLPASS_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Solpass error ${res.status}`);
  return data;
}

export async function POST(req: NextRequest) {
  if (!process.env.API_KEY) {
    return NextResponse.json({ error: "API_KEY not set" }, { status: 500 });
  }

  try {
    const { tmEvent, totalTickets, ticketPrice, partners, distributionThreshold } = await req.json();

    const shortId = tmEvent.id.slice(0, 16);

    const resolvedPartners = partners ?? [
      { partyName: "Artist", percentage: 8,  walletAddress: "" },
      { partyName: "Venue",  percentage: 5,  walletAddress: "" },
      { partyName: "TM",     percentage: 2,  walletAddress: "CD8bTqYcRvEvG1y73S5yZMP4PmXkqiMaP9NYvx6vxGbo" },
    ];

    // Map TM event → Solpass CreateEventDto
    const createBody = {
      eventId: shortId,
      name: tmEvent.name.slice(0, 32),
      description: `${tmEvent.genre ?? "Event"} at ${tmEvent.venue}`.slice(0, 200),
      venue: tmEvent.venue.slice(0, 64),
      eventDate: tmEvent.date ? new Date(tmEvent.date).toISOString() : new Date().toISOString(),
      totalTickets: totalTickets ?? 100,
      ticketPrice: ticketPrice ?? tmEvent.minPrice ?? 100,
      royaltyDistribution: resolvedPartners,
      distributionThreshold: distributionThreshold ?? Math.ceil(resolvedPartners.length / 2),
    };

    // Step 1: Create event — fall back to existing if already created
    let solpassId: string;
    let routeId: string;

    try {
      const created = await solpassFetch("/api/v1/events", "POST", createBody);
      solpassId = created.id;
      routeId = created.eventId;
    } catch (err: any) {
      if (!err.message?.includes("already exists")) throw err;
      // Event was created in a previous attempt — fetch it by shortId
      const event = await solpassFetch(`/api/v1/events/${shortId}`, "GET");
      if (!event) throw new Error("Event already exists but could not be retrieved");
      solpassId = event.id;
      routeId = event.eventId;
      // Update wallet addresses in case the previous attempt had empty ones
      if (partners) {
        await solpassFetch(`/api/v1/events/${routeId}`, "PATCH", { royaltyDistribution: partners });
      }
    }

    if (!solpassId || !routeId) throw new Error("Could not resolve event IDs");

    // Step 2: Initialize blockchain (skip if already done)
    try {
      await solpassFetch(`/api/v1/events/${routeId}/initialize-blockchain`, "POST");
    } catch (err: any) {
      if (!err.message?.includes("already")) throw err;
    }

    // Step 3: Enable USDC accounts for partners
    await solpassFetch(`/api/v1/events/${routeId}/enable-partner-usdc`, "POST");

    return NextResponse.json({ solpassId, eventId: routeId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
