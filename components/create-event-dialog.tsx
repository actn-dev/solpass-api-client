"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { usePlatform } from "@/lib/hooks/use-platform";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface RoyaltyPartner {
  partyName: string;
  percentage: number;
  walletAddress: string;
}

export function CreateEventDialog({ open, onOpenChange, onSuccess }: CreateEventDialogProps) {
  const { apiKey, isConfigured } = usePlatform();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"create" | "initialize" | "enable-usdc" | "complete">("create");
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventId: "",
    name: "",
    description: "",
    venue: "",
    eventDate: "",
    totalTickets: 100,
    ticketPrice: 10000, // $100.00 in cents
  });

  const [partners, setPartners] = useState<RoyaltyPartner[]>([
    { partyName: "Artist", percentage: 5, walletAddress: "" },
    { partyName: "Venue", percentage: 3, walletAddress: "" },
  ]);

  const handleCreateEvent = async () => {
    if (!isConfigured || !apiKey) {
      setError("Please configure your API key first");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Validate percentages
    const totalPercentage = partners.reduce((sum, p) => sum + p.percentage, 0);
    if (totalPercentage > 100) {
      setError("Total royalty percentage cannot exceed 100%");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.POST("/api/v1/events", {
        body: {
          eventId: formData.eventId,
          name: formData.name,
          description: formData.description,
          venue: formData.venue,
          eventDate: formData.eventDate,
          totalTickets: formData.totalTickets,
          ticketPrice: formData.ticketPrice,
          royaltyDistribution: partners,
        },
      });

      if (response.error) {
        throw new Error("Failed to create event");
      }

      const eventData = response.data as any;
      console.log('eventData', eventData);
      setCreatedEventId(eventData.eventId);
      setStep("initialize");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeBlockchain = async () => {
    if (!createdEventId || !apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.POST("/api/v1/events/{id}/initialize-blockchain", {
        params: { 
          path: { id: createdEventId },
        },
      });

      if (response.error) {
        throw new Error("Failed to initialize blockchain");
      }

      setStep("enable-usdc");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize blockchain");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableUSDC = async () => {
    if (!createdEventId || !apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.POST("/api/v1/events/{id}/enable-partner-usdc", {
        params: { 
          path: { id: createdEventId },
        },
      });

      if (response.error) {
        throw new Error("Failed to enable USDC accounts");
      }

      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable USDC accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Reset form
    setFormData({
      eventId: "",
      name: "",
      description: "",
      venue: "",
      eventDate: "",
      totalTickets: 100,
      ticketPrice: 10000,
    });
    setPartners([
      { partyName: "Artist", percentage: 5, walletAddress: "ArtistWallet123456789012345678901234567" },
      { partyName: "Venue", percentage: 3, walletAddress: "VenueWallet1234567890123456789012345678" },
    ]);
    setStep("create");
    setCreatedEventId(null);
    setError(null);
    onSuccess();
  };

  const addPartner = () => {
    setPartners([...partners, { partyName: "", percentage: 0, walletAddress: "" }]);
  };

  const updatePartner = (index: number, field: keyof RoyaltyPartner, value: string | number) => {
    const updated = [...partners];
    updated[index] = { ...updated[index], [field]: value };
    setPartners(updated);
  };

  const removePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "create" && "Create New Event"}
            {step === "initialize" && "Initialize Blockchain"}
            {step === "enable-usdc" && "Enable USDC Accounts"}
            {step === "complete" && "Event Created Successfully!"}
          </DialogTitle>
          <DialogDescription>
            {step === "create" && "Fill in event details and royalty distribution"}
            {step === "initialize" && "Initialize the event on the blockchain"}
            {step === "enable-usdc" && "Enable USDC token accounts for all partners"}
            {step === "complete" && "Your event is ready to sell tickets"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "create" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventId">Event ID (max 16 chars)</Label>
                <Input
                  id="eventId"
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  placeholder="concert-001"
                  maxLength={16}
                />
              </div>
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rock Concert"
                  maxLength={32}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Amazing rock concert"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Madison Square Garden"
                />
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalTickets">Total Tickets</Label>
                <Input
                  id="totalTickets"
                  type="number"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="ticketPrice">Ticket Price (cents)</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ${(formData.ticketPrice / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Royalty Partners</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPartner}>
                  + Add Partner
                </Button>
              </div>
              <div className="space-y-3">
                {partners.map((partner, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Party name"
                        value={partner.partyName}
                        onChange={(e) => updatePartner(index, "partyName", e.target.value)}
                      />
                      <Input
                        placeholder="Wallet address"
                        value={partner.walletAddress}
                        onChange={(e) => updatePartner(index, "walletAddress", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Percentage"
                        value={partner.percentage}
                        onChange={(e) => updatePartner(index, "percentage", parseFloat(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePartner(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total: {partners.reduce((sum, p) => sum + p.percentage, 0)}%
              </p>
            </div>
          </div>
        )}

        {step === "initialize" && (
          <div className="py-6 text-center">
            <Badge className="mb-4">Step 2/3</Badge>
            <p className="text-muted-foreground">
              Initialize your event on the Solana blockchain to enable ticket sales and royalty distribution.
            </p>
          </div>
        )}

        {step === "enable-usdc" && (
          <div className="py-6 text-center">
            <Badge className="mb-4">Step 3/3</Badge>
            <p className="text-muted-foreground">
              Enable USDC token accounts for all partners to receive royalty payments.
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="py-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-medium mb-2">Event Created Successfully!</p>
            <p className="text-muted-foreground">
              Your event is now live and ready to sell tickets on the blockchain.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "create" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Event"}
              </Button>
            </>
          )}
          {step === "initialize" && (
            <Button onClick={handleInitializeBlockchain} disabled={isLoading}>
              {isLoading ? "Initializing..." : "Initialize Blockchain"}
            </Button>
          )}
          {step === "enable-usdc" && (
            <Button onClick={handleEnableUSDC} disabled={isLoading}>
              {isLoading ? "Enabling..." : "Enable USDC Accounts"}
            </Button>
          )}
          {step === "complete" && (
            <Button onClick={handleComplete}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
