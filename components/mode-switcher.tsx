"use client";

import { useMode, UserMode } from "@/lib/hooks/use-mode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModeSwitcher() {
  const { mode, setMode, getWalletAddress } = useMode();

  const modes: { value: UserMode; label: string; color: string }[] = [
    { value: "admin", label: "Shop Admin", color: "bg-blue-500" },
    { value: "user1", label: "User 1", color: "bg-green-500" },
    { value: "user2", label: "User 2", color: "bg-purple-500" },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Simulation Mode
          </h3>
          <div className="flex gap-2">
            {modes.map((m) => (
              <Button
                key={m.value}
                variant={mode === m.value ? "default" : "outline"}
                onClick={() => setMode(m.value)}
                className="flex-1"
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Mode:</span>
            <Badge className={modes.find(m => m.value === mode)?.color}>
              {modes.find(m => m.value === mode)?.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Wallet:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {getWalletAddress().slice(0, 20)}...
            </code>
          </div>
        </div>
      </div>
    </Card>
  );
}
