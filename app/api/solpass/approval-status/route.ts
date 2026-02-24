import { NextRequest, NextResponse } from "next/server";

const SOLPASS_API = process.env.SOLPASS_API_URL ?? "https://api.solpass.app";

export async function GET(req: NextRequest) {
  if (!process.env.API_KEY) {
    return NextResponse.json({ error: "API_KEY not set" }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const res = await fetch(`${SOLPASS_API}/api/v1/events/${eventId}/approval-status`, {
      headers: { Authorization: `Bearer ${process.env.API_KEY}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? `Solpass error ${res.status}`);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
