"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { usePlatform } from "@/lib/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, RefreshCw, Download, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ApiKeysPage() {
  const { getApiKey, regenerateApiKey } = useAuth();
  const { setApiKey: setPlatformApiKey, isConfigured } = usePlatform();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleGetApiKey = async () => {
    setIsLoading(true);
    try {
      const key = await getApiKey();
      setApiKey(key);
      setPlatformApiKey(key);
      setShowKey(true);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure? This will invalidate your current API key.")) {
      return;
    }

    setIsLoading(true);
    try {
      const key = await regenerateApiKey();
      setApiKey(key);
      setPlatformApiKey(key);
      setShowKey(true);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncApiKey = async () => {
    setIsSyncing(true);
    try {
      const key = await getApiKey();
      setPlatformApiKey(key);
      setApiKey(key);
      toast.success("API key synced successfully!");
    } catch {
      toast.error("Failed to sync API key. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (!apiKey) return;

    const content = `# Solpass API Configuration
# DO NOT commit this file to version control!

SOLPASS_API_KEY=${apiKey}
SOLPASS_API_URL=http://localhost:3000
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env.local";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Environment file downloaded!");
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    return `${key.slice(0, 7)}${"•".repeat(20)}${key.slice(-4)}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-1">
          Manage your API keys for third-party integration
        </p>
      </div>

      {/* Security Warning */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Keep your API keys secure. Never commit them to version control or share them publicly.
        </AlertDescription>
      </Alert>

      {/* Current API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Key</CardTitle>
          <CardDescription>
            Use this key to authenticate API requests from your integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!apiKey ? (
            <Button onClick={handleGetApiKey} disabled={isLoading}>
              <Key className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Reveal API Key"}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={showKey ? apiKey : maskApiKey(apiKey)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    title="Download as .env file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? "Hide" : "Show"} Full Key
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Regenerate Key */}
      <Card>
        <CardHeader>
          <CardTitle>Regenerate API Key</CardTitle>
          <CardDescription>
            Generate a new API key. This will invalidate your current key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleRegenerateKey}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Key
          </Button>
        </CardContent>
      </Card>

      {/* Sync API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Sync API Key to Platform</CardTitle>
          <CardDescription>
            Fetches your current API key and saves it locally so the Ticketmaster integration and other simulations can use it.
            Use this if you see &quot;API key not configured&quot; errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button onClick={handleSyncApiKey} disabled={isSyncing} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {isSyncing ? "Syncing..." : "Sync API Key"}
          </Button>
          {isConfigured && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Configured
            </span>
          )}
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            How to use your API key for third-party integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication Header</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Example Usage (JavaScript)</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`const response = await fetch('http://localhost:3000/api/v1/events/:id/initialize-blockchain', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.SOLPASS_API_KEY}\`,
    'Content-Type': 'application/json'
  }
});`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Protected Endpoints</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>POST /api/v1/events/:id/initialize-blockchain</li>
              <li>POST /api/v1/events/:id/distribute</li>
              <li>POST /api/v1/events/:eventId/tickets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
