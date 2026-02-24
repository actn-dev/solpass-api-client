"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertCircle, Wallet, ShieldCheck } from "lucide-react";

// ─── Known demo wallet → base58 private key map ──────────────────────────────
// TM    wallet: CD8bTqYcRvEvG1y73S5yZMP4PmXkqiMaP9NYvx6vxGbo
// Artist wallet: E6R7hsTFCom2X24ZA3TwQM6m3aCY4r67jGTWagbsDtLq
// Venue  wallet: 6koGwhYQdGYpqvivd4BBergSagjuUaT9Ytiy1vUDLZRY
const KNOWN_KEYS: Record<string, string> = {
    "CD8bTqYcRvEvG1y73S5yZMP4PmXkqiMaP9NYvx6vxGbo":
        "5cgdbQoEmUagAU8L5QrQxPCNtvDDqTN9pqJ82MDWKwfjjBBsRDrUmz73TTzwydyTY83HQtgCobrgsjVxeBVxFaso",
    "E6R7hsTFCom2X24ZA3TwQM6m3aCY4r67jGTWagbsDtLq":
        "2UJxNbPEnE4E9MpAEFriffQ8LfdnMH2xF48zu3krvxZQ79BvVLQdb5G1sUofzjhade6F9Fu42SvcVxN3JTzP3kSd",
    "6koGwhYQdGYpqvivd4BBergSagjuUaT9Ytiy1vUDLZRY":
        "2WirhdARLXzpGbz8QA6LB1QHstrxeWypEsp81s8XEBRuLpNNkFn52AR5FEXaG6PouSe6himGbRMwBnYn89UrHA6",
};

interface Party {
    partyName: string;
    walletAddress: string;
    percentage: number;
    approved: boolean;
}

interface ApprovalStatus {
    blockchainEnabled: boolean;
    threshold: number;
    totalParties: number;
    approvedCount: number;
    canDistribute: boolean;
    royaltyDistributed: boolean;
    executed: boolean;
    escrowBalance: number;
    parties: Party[];
    message?: string;
}

interface RoyaltiesTabProps {
    eventId: string; // business eventId (e.g. "concert-001"), used for API calls
}

export function RoyaltiesTab({ eventId }: RoyaltiesTabProps) {
    // keyMap: walletAddress → base58 private key (pre-loaded with known demo keys)
    const [keyMap, setKeyMap] = useState<Record<string, string>>(KNOWN_KEYS);

    // Popover state: which wallet is asking for a key input
    const [keyDialogWallet, setKeyDialogWallet] = useState<Party | null>(null);
    const [pendingKey, setPendingKey] = useState("");
    const [pendingKeyError, setPendingKeyError] = useState<string | null>(null);

    // Per-party loading state
    const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
    const [distributeLoading, setDistributeLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: status, isLoading, error } = useQuery<ApprovalStatus>({
        queryKey: ["approval-status", eventId],
        queryFn: async () => {
            const res = await fetch(`/api/solpass/approval-status?eventId=${eventId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to fetch approval status");
            return data;
        },
        refetchInterval: (query) => {
            const d = query.state.data;
            // Keep polling until distributed
            if (!d || d.royaltyDistributed) return false;
            return 6000;
        },
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["approval-status", eventId] });

    // ── Approve: submits approval for a given party ──────────────────────────
    const doApprove = async (party: Party, privateKey: string) => {
        setLoadingWallet(party.walletAddress);
        setActionError(null);
        setActionSuccess(null);
        try {
            const res = await fetch("/api/solpass/approve-distribution", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, signerPrivateKey: privateKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Approval failed");
            setActionSuccess(`✓ ${party.partyName} approved`);
            await invalidate();
        } catch (err: any) {
            setActionError(err.message);
        } finally {
            setLoadingWallet(null);
        }
    };

    // Called when user clicks "Approve" on a party with a known key
    const handleApproveKnown = (party: Party) => {
        doApprove(party, keyMap[party.walletAddress]);
    };

    // Called when user confirms pasting a private key
    const handleKeyConfirm = async () => {
        if (!keyDialogWallet) return;
        if (!pendingKey.trim()) {
            setPendingKeyError("Please paste the private key");
            return;
        }
        // Save to keyMap and immediately approve
        setKeyMap((prev) => ({ ...prev, [keyDialogWallet.walletAddress]: pendingKey.trim() }));
        setKeyDialogWallet(null);
        setPendingKey("");
        setPendingKeyError(null);
        await doApprove(keyDialogWallet, pendingKey.trim());
    };

    // ── Distribute ────────────────────────────────────────────────────────────
    const handleDistribute = async () => {
        setDistributeLoading(true);
        setActionError(null);
        setActionSuccess(null);
        try {
            const res = await fetch("/api/solpass/distribute-royalty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Distribution failed");
            setActionSuccess("✓ Royalties distributed successfully!");
            await invalidate();
        } catch (err: any) {
            setActionError(err.message);
        } finally {
            setDistributeLoading(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground animate-pulse">
                    Loading approval status...
                </CardContent>
            </Card>
        );
    }

    if (error || !status) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                        {(error as any)?.message ?? "Could not load approval status"}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!status.blockchainEnabled) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Event not yet initialized on blockchain.</p>
                </CardContent>
            </Card>
        );
    }

    // ── State 1: Already distributed ─────────────────────────────────────────
    if (status.royaltyDistributed) {
        return (
            <Card className="border-green-500/30">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-green-600">Royalties Distributed</CardTitle>
                    </div>
                    <CardDescription>
                        All funds have been sent to party wallets. No further action required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {status.parties.map((p) => (
                            <div key={p.walletAddress} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    <span className="font-medium">{p.partyName}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{p.walletAddress.slice(0, 8)}…</span>
                                </div>
                                <span className="font-semibold text-green-600">
                                    ${((status.escrowBalance * p.percentage) / 100).toFixed(4)}
                                    <span className="text-muted-foreground font-normal ml-1">({p.percentage}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground text-right">
                        Total distributed: <span className="font-semibold">${status.escrowBalance.toFixed(4)}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ── States 2 & 3: Approval progress ──────────────────────────────────────
    const progressPct = status.totalParties > 0
        ? Math.round((status.approvedCount / status.threshold) * 100)
        : 0;

    return (
        <>
            <div className="space-y-4">
                {/* Approval progress card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <CardTitle>Multi-Sig Approval</CardTitle>
                            </div>
                            <Badge variant={status.canDistribute ? "default" : "secondary"}>
                                {status.approvedCount} / {status.threshold} approvals
                            </Badge>
                        </div>
                        <CardDescription>
                            {status.canDistribute
                                ? "Threshold met — ready to distribute royalties."
                                : `${status.threshold - status.approvedCount} more approval(s) needed before distribution.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* Progress bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(progressPct, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Escrow balance: <span className="font-medium text-foreground">${status.escrowBalance.toFixed(4)}</span></span>
                            <span>{status.approvedCount} of {status.threshold} required</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Partner rows */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Party Approvals</CardTitle>
                        <CardDescription>
                            Each partner must sign to approve the distribution. Known demo wallets can be approved with one click.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {status.parties.map((party) => {
                            const hasKey = !!keyMap[party.walletAddress];
                            const isApproved = party.approved;
                            const isLoading = loadingWallet === party.walletAddress;
                            const estimatedAmount = (status.escrowBalance * party.percentage) / 100;

                            return (
                                <div
                                    key={party.walletAddress}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isApproved ? "bg-green-500/5 border-green-500/30" : "bg-muted/30"}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {isApproved
                                            ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        }
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{party.partyName}</span>
                                                <span className="text-xs text-muted-foreground">{party.percentage}%</span>
                                                {hasKey && !isApproved && (
                                                    <Badge variant="outline" className="text-[10px] py-0 h-4">demo key</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono mt-0.5">
                                                <Wallet className="h-3 w-3" />
                                                {party.walletAddress.slice(0, 12)}…{party.walletAddress.slice(-6)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-sm font-semibold text-right">
                                            ${estimatedAmount.toFixed(4)}
                                        </span>
                                        {isApproved ? (
                                            <Badge className="bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/20">
                                                Approved
                                            </Badge>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant={hasKey ? "default" : "outline"}
                                                className="h-7 text-xs"
                                                disabled={isLoading || distributeLoading}
                                                onClick={() => {
                                                    if (hasKey) {
                                                        handleApproveKnown(party);
                                                    } else {
                                                        setPendingKey("");
                                                        setPendingKeyError(null);
                                                        setKeyDialogWallet(party);
                                                    }
                                                }}
                                            >
                                                {isLoading ? "Approving…" : hasKey ? "Simulate Approval" : "Approve →"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Distribute button */}
                {status.canDistribute && (
                    <Card className="border-primary/30">
                        <CardContent className="pt-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold">Ready to distribute</p>
                                <p className="text-sm text-muted-foreground">
                                    All required approvals received. Distribute <strong>${status.escrowBalance.toFixed(4)}</strong> to {status.totalParties} parties.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                disabled={distributeLoading}
                                onClick={handleDistribute}
                            >
                                {distributeLoading ? "Distributing…" : "Distribute Royalties"}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Feedback messages */}
                {actionSuccess && (
                    <Alert className="border-green-500/40 bg-green-500/5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700">{actionSuccess}</AlertDescription>
                    </Alert>
                )}
                {actionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Key input dialog for unknown wallets */}
            <Dialog open={!!keyDialogWallet} onOpenChange={(open) => { if (!open) setKeyDialogWallet(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Enter Private Key</DialogTitle>
                        <DialogDescription>
                            Paste the base58 private key for{" "}
                            <strong>{keyDialogWallet?.partyName}</strong> (
                            <span className="font-mono text-xs">{keyDialogWallet?.walletAddress.slice(0, 10)}…</span>
                            ) to simulate their approval.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label>Base58 Private Key</Label>
                        <Input
                            className="font-mono text-sm"
                            placeholder="5abc…xyz"
                            value={pendingKey}
                            onChange={(e) => { setPendingKey(e.target.value); setPendingKeyError(null); }}
                        />
                        {pendingKeyError && (
                            <p className="text-xs text-destructive">{pendingKeyError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            The key is only used for this approval and is not stored persistently.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setKeyDialogWallet(null)}>Cancel</Button>
                        <Button onClick={handleKeyConfirm} disabled={!!loadingWallet}>
                            {loadingWallet ? "Approving…" : "Confirm & Approve"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
