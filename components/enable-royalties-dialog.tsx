"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface TMEvent {
    id: string; name: string; venue: string; city: string;
    date: string | null; minPrice: number | null; genre: string | null;
}

interface Partner { partyName: string; percentage: number; walletAddress: string; }

interface Props {
    tmEvent: TMEvent | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: (solpassId: string) => void;
}

export function EnableRoyaltiesDialog({ tmEvent, open, onOpenChange, onSuccess }: Props) {
    const DEMO_WALLET = "E6R7hsTFCom2X24ZA3TwQM6m3aCY4r67jGTWagbsDtLq";
    const [partners, setPartners] = useState<Partner[]>([
        { partyName: "Artist", percentage: 5, walletAddress: DEMO_WALLET },
        { partyName: "Venue", percentage: 3, walletAddress: DEMO_WALLET },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updatePartner = (i: number, field: keyof Partner, value: string | number) => {
        setPartners((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
    };

    const handleSubmit = async () => {
        if (!tmEvent) return;
        const missing = partners.filter((p) => !p.walletAddress.trim());
        if (missing.length) {
            setError(`Wallet address required for: ${missing.map((p) => p.partyName).join(", ")}`);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/solpass/enable-royalties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tmEvent, partners }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed");
            onSuccess(data.solpassId);
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!tmEvent) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Enable Solpass Royalties</DialogTitle>
                    <DialogDescription>
                        Registering <strong>{tmEvent.name}</strong> on Solpass. Add partner wallet addresses to receive royalties on resale.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Read-only TM info */}
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded p-3">
                        <div><span className="text-muted-foreground">Venue:</span> {tmEvent.venue}</div>
                        <div><span className="text-muted-foreground">Date:</span> {tmEvent.date ?? "TBA"}</div>
                    </div>

                    {/* Partner wallets */}
                    <div className="space-y-2">
                        <Label>Royalty Partners</Label>
                        {partners.map((p, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <Input className="w-20 shrink-0" value={p.partyName} onChange={(e) => updatePartner(i, "partyName", e.target.value)} placeholder="Name" />
                                <Input className="w-16 shrink-0" type="number" value={p.percentage} onChange={(e) => updatePartner(i, "percentage", Number(e.target.value))} placeholder="%" />
                                <Input value={p.walletAddress} onChange={(e) => updatePartner(i, "walletAddress", e.target.value)} placeholder="Solana wallet address" />
                            </div>
                        ))}
                    </div>

                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Enabling..." : "Enable Royalties"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
