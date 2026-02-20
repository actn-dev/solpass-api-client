import { NextRequest, NextResponse } from "next/server";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiKey = process.env.TM_CONSUMER_KEY;
  if (!apiKey) return NextResponse.json({ error: "TM_CONSUMER_KEY not set" }, { status: 500 });

  const res = await fetch(`${TM_BASE}/events/${id}.json?apikey=${apiKey}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return NextResponse.json({ error: "TM API error" }, { status: 502 });

  const e = await res.json();
  return NextResponse.json({
    id: e.id,
    name: e.name,
    url: e.url,
    date: e.dates?.start?.localDate ?? null,
    time: e.dates?.start?.localTime ?? null,
    image: e.images?.find((i: any) => i.ratio === "16_9" && i.width > 1000)?.url ?? e.images?.[0]?.url ?? null,
    venue: e._embedded?.venues?.[0]?.name ?? "TBA",
    city: e._embedded?.venues?.[0]?.city?.name ?? "",
    country: e._embedded?.venues?.[0]?.country?.name ?? "",
    address: e._embedded?.venues?.[0]?.address?.line1 ?? null,
    minPrice: e.priceRanges?.[0]?.min ?? null,
    maxPrice: e.priceRanges?.[0]?.max ?? null,
    currency: e.priceRanges?.[0]?.currency ?? "USD",
    genre: e.classifications?.[0]?.genre?.name ?? null,
    segment: e.classifications?.[0]?.segment?.name ?? null,
    attractions: e._embedded?.attractions?.map((a: any) => a.name) ?? [],
    seatmap: e.seatmap?.staticUrl ?? null,
    info: e.info ?? null,
  });
}
