import { NextRequest, NextResponse } from "next/server";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

export async function GET(req: NextRequest) {
  const apiKey = process.env.TM_CONSUMER_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TM_CONSUMER_KEY not set" }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const keyword = searchParams.get("keyword") || "concert";
  const size = searchParams.get("size") || "12";

  const url = `${TM_BASE}/events.json?apikey=${apiKey}&keyword=${keyword}&size=${size}&sort=date,asc`;

  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) {
    return NextResponse.json({ error: "TM API error", status: res.status }, { status: 502 });
  }

  const data = await res.json();
  const events = data._embedded?.events ?? [];

  // Return only the fields we need
  const mapped = events.map((e: any) => ({
    id: e.id,
    name: e.name,
    url: e.url,
    date: e.dates?.start?.localDate ?? null,
    time: e.dates?.start?.localTime ?? null,
    image: e.images?.find((i: any) => i.ratio === "16_9" && i.width > 500)?.url ?? e.images?.[0]?.url ?? null,
    venue: e._embedded?.venues?.[0]?.name ?? "TBA",
    city: e._embedded?.venues?.[0]?.city?.name ?? "",
    minPrice: e.priceRanges?.[0]?.min ?? null,
    maxPrice: e.priceRanges?.[0]?.max ?? null,
    genre: e.classifications?.[0]?.genre?.name ?? null,
  }));

  return NextResponse.json({ events: mapped, total: data.page?.totalElements ?? mapped.length });
}
