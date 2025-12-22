"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/lib/hooks/use-platform";
import { Key, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { ApiKeyConfig } from "./api-key-config";

export function PlatformHeader() {
  const { isConfigured } = usePlatform();
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Partner Platform Simulation:</strong> This page simulates your own website/platform
          integrating with SolPass API. All operations use your API key.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">API Key Status:</span>
          </div>
          {isConfigured ? (
            <Badge variant="default" className="gap-1">
              ✓ Configured
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              ⚠ Not Configured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Go to Dashboard
            </Button>
          </Link>
          <Button size="sm" onClick={() => setConfigOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {isConfigured ? "Update" : "Configure"} API Key
          </Button>
        </div>
      </div>

      <ApiKeyConfig open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}
