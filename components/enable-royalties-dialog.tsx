"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

const PARTNER2 = "E6R7hsTFCom2X24ZA3TwQM6m3aCY4r67jGTWagbsDtLq";
const PARTNER3 = "6koGwhYQdGYpqvivd4BBergSagjuUaT9Ytiy1vUDLZRY";
const TM_WALLET = "CD8bTqYcRvEvG1y73S5yZMP4PmXkqiMaP9NYvx6vxGbo";
const MAX_PARTNERS = 12;

export function EnableRoyaltiesDialog({ tmEvent, open, onOpenChange, onSuccess }: Props) {
    const [partners, setPartners] = useState<Partner[]>([
        { partyName: "Artist", percentage: 8, walletAddress: PARTNER2 },
        { partyName: "Venue", percentage: 5, walletAddress: PARTNER3 },
        { partyName: "TM", percentage: 2, walletAddress: TM_WALLET },
    ]);
    // Default threshold: majority (ceil of half)
    const [distributionThreshold, setDistributionThreshold] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updatePartner = (i: number, field: keyof Partner, value: string | number) => {
        setPartners((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
    };

    const addPartner = () => {
        if (partners.length >= MAX_PARTNERS) return;
        setPartners((prev) => [...prev, { partyName: "", percentage: 0, walletAddress: "" }]);
    };

    const removePartner = (i: number) => {
        if (partners.length <= 1) return;
        setPartners((prev) => {
            const next = prev.filter((_, idx) => idx !== i);
            // Clamp threshold if it now exceeds party count
            setDistributionThreshold((t) => Math.min(t, next.length));
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!tmEvent) return;

        const missing = partners.filter((p) => !p.walletAddress.trim());
        if (missing.length) {
            setError(`Wallet address required for: ${missing.map((p) => p.partyName || "(unnamed)").join(", ")}`);
            return;
        }
        const missingName = partners.filter((p) => !p.partyName.trim());
        if (missingName.length) {
            setError("Each partner must have a name.");
            return;
        }
        const totalPct = partners.reduce((s, p) => s + p.percentage, 0);
        if (totalPct > 100) {
            setError(`Total royalty percentage is ${totalPct}% — must be 100% or less.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/solpass/enable-royalties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tmEvent, partners, distributionThreshold }),
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

    const totalPct = partners.reduce((s, p) => s + p.percentage, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Enable Solpass Royalties</DialogTitle>
                    <DialogDescription>
                        Registering <strong>{tmEvent.name}</strong> on Solpass. Configure partners and multi-sig approval threshold.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Read-only TM info */}
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded p-3">
                        <div><span className="text-muted-foreground">Venue:</span> {tmEvent.venue}</div>
                        <div><span className="text-muted-foreground">Date:</span> {tmEvent.date ?? "TBA"}</div>
                    </div>

                    {/* Partner wallets */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Royalty Partners <span className="text-muted-foreground font-normal">({partners.length}/{MAX_PARTNERS})</span></Label>
                            <span className={`text-xs font-medium ${totalPct > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                                Total: {totalPct}%
                            </span>
                        </div>

                        {/* Column headers */}
                        <div className="grid grid-cols-[80px_60px_1fr_28px] gap-2 text-xs text-muted-foreground px-1">
                            <span>Name</span><span>%</span><span>Wallet address</span><span />
                        </div>

                        {partners.map((p, i) => (
                            <div key={i} className="grid grid-cols-[80px_60px_1fr_28px] gap-2 items-center">
                                <Input
                                    className="h-8 text-sm"
                                    value={p.partyName}
                                    onChange={(e) => updatePartner(i, "partyName", e.target.value)}
                                    placeholder="Name"
                                />
                                <Input
                                    className="h-8 text-sm"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={p.percentage}
                                    onChange={(e) => updatePartner(i, "percentage", Number(e.target.value))}
                                    placeholder="%"
                                />
                                <Input
                                    className="h-8 text-sm font-mono"
                                    value={p.walletAddress}
                                    onChange={(e) => updatePartner(i, "walletAddress", e.target.value)}
                                    placeholder="Solana wallet address"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => removePartner(i)}
                                    disabled={partners.length <= 1}
                                    title="Remove partner"
                                >
                                    ×
                                </Button>
                            </div>
                        ))}

                        {partners.length < MAX_PARTNERS && (
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addPartner}>
                                + Add Partner
                            </Button>
                        )}
                    </div>

                    {/* Multi-sig threshold */}
                    <div className="space-y-2">
                        <Label>
                            Approval Threshold
                            <span className="ml-1 text-xs text-muted-foreground font-normal">
                                — how many partners must approve before royalties can be distributed
                            </span>
                        </Label>
                        <Select
                            value={String(distributionThreshold)}
                            onValueChange={(v) => setDistributionThreshold(Number(v))}
                        >
                            <SelectTrigger className="w-56">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: partners.length }, (_, i) => i + 1).map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n} of {partners.length} partner{partners.length > 1 ? "s" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
