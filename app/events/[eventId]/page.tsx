"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useMode } from "@/lib/hooks/use-mode";
import { usePlatform } from "@/lib/hooks/use-platform";
import { ModeSwitcher } from "@/components/mode-switcher";
import { PlatformHeader } from "@/components/platform/platform-header";
import { UserSwitcher } from "@/components/platform/user-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Ticket {
  ticketId: string;
  ownerId?: string;
  ownerWallet: string;
  currentPrice: number;
  originalPrice: number;
  forSale: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { mode, getWalletAddress, getUserId } = useMode();
  const { apiKey, isConfigured } = usePlatform();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [resalePrice, setResalePrice] = useState("");
  const [resaleDialogOpen, setResaleDialogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError, refetch: refetchEvent } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events/{id}", {
        params: { path: { id: eventId } },
      });
      if (response.error) throw new Error("Failed to fetch event");
      return response.data as any;
    },
  });

  // Fetch blockchain tickets (already purchased/resale)
  const { data: blockchainTickets, refetch: refetchTickets } = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: async () => {
      if (!event?.eventId) return [];
      const response = await apiClient.GET("/api/v1/events/{eventId}/tickets", {
        params: { path: { eventId: event.eventId } },
      });
      if (response.error) return [];
      return (response.data as any) || [];
    },
    enabled: !!event?.eventId && !!event?.blockchainEnabled,
  });

  console.log("blockchainTickets", blockchainTickets);
  // Convert ticket price to cents for internal calculations
  const ticketPriceInCents = event ? Math.round(parseFloat(event.ticketPrice) * 100) : 10000;

  // Generate primary sale tickets (not yet on blockchain)
  const totalTickets = event?.totalTickets || 0;
  const primarySaleTickets: Ticket[] = Array.from({ length: totalTickets }, (_, i) => ({
    ticketId: `${event?.eventId || eventId}-ticket-${i + 1}`,
    ownerWallet: "ShopAdmin1234567890abcdefghijklmnopqrstuvwxyz",
    currentPrice: ticketPriceInCents,
    originalPrice: ticketPriceInCents,
    forSale: true,
  }));

  // Parse blockchain tickets from API
  const blockchainTicketsArray = blockchainTickets?.tickets || [];
  
  const resaleTickets: Ticket[] = blockchainTicketsArray.map((bt: any) => ({
    ticketId: bt.ticketId,
    ownerId: bt.owner,
    ownerWallet: bt.ownerWallet || getWalletAddress(), // May not be in response
    currentPrice: bt.ticketPrice || ticketPriceInCents,
    originalPrice: ticketPriceInCents, // Assume event's original price
    forSale: true,
  }));

  // Purchase ticket mutation
  const purchaseMutation = useMutation({
    mutationFn: async (ticket: Ticket) => {
      if (!isConfigured || !apiKey) {
        throw new Error("API key not configured");
      }
      
      const response = await apiClient.POST("/api/v1/events/{eventId}/tickets", {
        params: { 
          path: { eventId: event.eventId },
        },
        body: {
          ticketId: ticket.ticketId,
          buyerWallet: getWalletAddress(),
          sellerWallet: ticket.ownerWallet,
          newPrice: ticket.currentPrice,
          originalPrice: ticket.originalPrice,
          buyerId: getUserId(),
          sellerId: ticket.ownerId || "unknown",
        },
      });
      if (response.error) throw new Error("Failed to purchase ticket");
      return response.data;
    },
    onSuccess: () => {
      alert("Ticket purchased successfully!");
      refetchTickets();
    },
    onError: (error) => {
      alert(`Purchase failed: ${error.message}`);
    },
  });

  const handleBuyTicket = (ticket: Ticket) => {
    if (mode === "admin") {
      alert("Shop admins cannot buy tickets. Switch to User1 or User2 mode.");
      return;
    }
    purchaseMutation.mutate(ticket);
  };

  const handleResell = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResalePrice(((ticket.currentPrice / 100) * 1.2).toFixed(2)); // 20% markup
    setResaleDialogOpen(true);
  };

  const handleConfirmResale = () => {
    if (!selectedTicket) return;
    
    const newPriceInCents = Math.round(parseFloat(resalePrice) * 100);
    
    // Here we would call the resale API
    alert(`Reselling ticket for $${resalePrice} (API integration needed for resale listing)`);
    setResaleDialogOpen(false);
  };

  const handleInitializeBlockchain = async () => {
    if (!event || event.blockchainEnabled) return;
    
    if (!isConfigured || !apiKey) {
      alert("Please configure your API key first");
      return;
    }
    
    setIsInitializing(true);
    try {
      // Step 1: Initialize blockchain
      const initResponse = await apiClient.POST("/api/v1/events/{id}/initialize-blockchain", {
        params: { 
          path: { id: eventId },
        },
      });
      
      if (initResponse.error) {
        throw new Error("Failed to initialize blockchain");
      }

      // Step 2: Enable USDC for partners
      const usdcResponse = await apiClient.POST("/api/v1/events/{id}/enable-partner-usdc", {
        params: { 
          path: { id: eventId },
        },
      });
      
      if (usdcResponse.error) {
        throw new Error("Failed to enable USDC accounts");
      }

      alert("Blockchain initialized successfully!");
      refetchEvent();
    } catch (error) {
      alert(`Initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsInitializing(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>Event not found or failed to load.</AlertDescription>
        </Alert>
        <Link href="/events">
          <Button className="mt-4">← Back to Events</Button>
        </Link>
      </div>
    );
  }

  // My owned tickets (from blockchain)
  const myTickets = resaleTickets.filter((t) => t.ownerId === getUserId());
  
  // Resale market (owned by others)
  const resaleMarketTickets = resaleTickets.filter((t) => t.ownerId !== getUserId());
  
  // Primary sale tickets (only show if blockchain is enabled)
  const availablePrimaryTickets = event?.blockchainEnabled ? primarySaleTickets : [];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
            <Link href="/events">
              <Button variant="outline">← Back to Events</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <UserSwitcher />
            <div>
              <ModeSwitcher />
            </div>
          </div>

          {/* Event Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Venue</Label>
                  <p className="font-medium">{event.venue}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {event.eventDate ? new Date(event.eventDate).toLocaleString() : "TBA"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Original Ticket Price</Label>
                  <p className="font-medium">${parseFloat(event.ticketPrice).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Tickets</Label>
                  <p className="font-medium">{event.totalTickets}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Blockchain Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.blockchainEnabled ? "default" : "secondary"}>
                      {event.blockchainEnabled ? "✓ Enabled" : "Not Enabled"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Blockchain Initialization Button */}
              {!event.blockchainEnabled && mode === "admin" && (
                <div className="mt-4 pt-4 border-t">
                  <Alert>
                    <AlertDescription className="mb-3">
                      This event needs to be initialized on the blockchain before tickets can be sold.
                      {!isConfigured && " Please configure your API key first."}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleInitializeBlockchain} 
                    disabled={isInitializing || !isConfigured}
                    className="w-full mt-2"
                  >
                    {isInitializing ? "Initializing..." : "⛓️ Initialize Blockchain"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Tickets */}
          {myTickets.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">My Tickets</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {myTickets.map((ticket) => (
                  <Card key={ticket.ticketId}>
                    <CardHeader>
                      <CardTitle className="text-lg">{ticket.ticketId}</CardTitle>
                      <CardDescription>Owned by you</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase Price:</span>
                          <span className="font-medium">${(ticket.currentPrice / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleResell(ticket)}
                      >
                        Resell Ticket
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Tickets */}
          <div>
            {/* Primary Sale Section */}
            {availablePrimaryTickets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  🎫 Buy from Shop (Primary Sale)
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {availablePrimaryTickets.map((ticket) => (
                    <Card key={ticket.ticketId}>
                      <CardHeader>
                        <CardTitle className="text-lg">{ticket.ticketId}</CardTitle>
                        <CardDescription>
                          <Badge variant="default">Primary Sale</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-bold text-lg">
                              ${(ticket.currentPrice / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {mode !== "admin" && (
                          <Button
                            className="w-full"
                            onClick={() => handleBuyTicket(ticket)}
                            disabled={purchaseMutation.isPending}
                          >
                            {purchaseMutation.isPending ? "Purchasing..." : "Buy Ticket"}
                          </Button>
                        )}
                        {mode === "admin" && (
                          <Button className="w-full" disabled variant="outline">
                            Admin View Only
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Resale Market Section */}
            {resaleMarketTickets.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  🔄 Resale Market
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {resaleMarketTickets.map((ticket) => (
                    <Card key={ticket.ticketId}>
                      <CardHeader>
                        <CardTitle className="text-lg">{ticket.ticketId}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary">Resale</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-bold text-lg">
                              ${(ticket.currentPrice / 100).toFixed(2)}
                            </span>
                          </div>
                          {ticket.currentPrice !== ticket.originalPrice && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Original:</span>
                              <span className="line-through">
                                ${(ticket.originalPrice / 100).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        {mode !== "admin" && (
                          <Button
                            className="w-full"
                            onClick={() => handleBuyTicket(ticket)}
                            disabled={purchaseMutation.isPending}
                          >
                            {purchaseMutation.isPending ? "Purchasing..." : "Buy Resale Ticket"}
                          </Button>
                        )}
                        {mode === "admin" && (
                          <Button className="w-full" disabled variant="outline">
                            Admin View Only
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No tickets available */}
            {availablePrimaryTickets.length === 0 && resaleMarketTickets.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {!event?.blockchainEnabled 
                      ? "Event blockchain not initialized yet. Admin needs to enable it first."
                      : "No tickets available for purchase."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resale Dialog */}
          <Dialog open={resaleDialogOpen} onOpenChange={setResaleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resell Ticket</DialogTitle>
                <DialogDescription>
                  Set a resale price for your ticket: {selectedTicket?.ticketId}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="resalePrice">Resale Price (USD)</Label>
                  <Input
                    id="resalePrice"
                    type="number"
                    step="0.01"
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    placeholder="120.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Original price: ${((selectedTicket?.originalPrice || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResaleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmResale}>List for Resale</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
