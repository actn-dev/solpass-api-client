"use client";

import { usePlatform } from "@/lib/hooks/use-platform";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Key, Info, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface ApiKeyConfigProps {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyConfig({ open, onClose }: ApiKeyConfigProps) {
  const { apiKey, setApiKey, clearApiKey } = usePlatform();
  const [inputKey, setInputKey] = useState("");

  const handleSave = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      setInputKey("");
      onClose();
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configure SolPass API Key
          </DialogTitle>
          <DialogDescription>
            Enter your API key to enable blockchain operations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Get your API key from the{" "}
              <Link href="/dashboard/api-keys" className="font-medium underline">
                SolPass Dashboard
              </Link>
              . You need to be logged in as a partner.
            </AlertDescription>
          </Alert>

          {apiKey ? (
            <div className="space-y-3">
              <Label>Current API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={`${apiKey.slice(0, 7)}${"•".repeat(20)}${apiKey.slice(-4)}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="destructive" onClick={handleClear}>
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                API key is configured and ready to use
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="sk_..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Starts with "sk_" followed by 32 characters
              </p>
            </div>
          )}

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">How to get your API key:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Login to SolPass Dashboard</li>
              <li>Go to API Keys page</li>
              <li>Click "Reveal API Key"</li>
              <li>Copy and paste here</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          {apiKey ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!inputKey.trim()}>
                Save API Key
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
