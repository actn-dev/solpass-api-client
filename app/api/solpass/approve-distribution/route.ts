import { NextRequest, NextResponse } from "next/server";

const SOLPASS_API = process.env.SOLPASS_API_URL ?? "https://api.solpass.app";

export async function POST(req: NextRequest) {
  if (!process.env.API_KEY) {
    return NextResponse.json({ error: "API_KEY not set" }, { status: 500 });
  }
  try {
    const { eventId, signerPrivateKey } = await req.json();
    if (!eventId || !signerPrivateKey) {
      return NextResponse.json({ error: "eventId and signerPrivateKey required" }, { status: 400 });
    }

    const res = await fetch(`${SOLPASS_API}/api/v1/events/${eventId}/approve-distribution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({ signerPrivateKey }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? `Solpass error ${res.status}`);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
