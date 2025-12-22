"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyDisplayModalProps {
  apiKey: string;
  open: boolean;
  onClose: () => void;
}

export function ApiKeyDisplayModal({
  apiKey,
  open,
  onClose,
}: ApiKeyDisplayModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Save Your API Key
          </DialogTitle>
          <DialogDescription>
            This is the only time your API key will be displayed. Please save it
            securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Important Security Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This key will only be shown once</li>
                  <li>Store it in a secure location</li>
                  <li>Never commit it to version control</li>
                  <li>Use environment variables in production</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your API Key</label>
            <div className="flex gap-2">
              <Input value={apiKey} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Copied to clipboard!
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download as .env file
            </Button>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Usage Example:</p>
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
              <code>{`// In your integration code:
const client = new SolpassClient({
  apiKey: process.env.SOLPASS_API_KEY,
  baseUrl: 'http://localhost:3000'
});`}</code>
            </pre>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>I've Saved My API Key</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
