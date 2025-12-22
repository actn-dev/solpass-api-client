"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your partner account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <Input
              value={user?.walletAddress || ""}
              disabled
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>User ID</Label>
            <Input value={user?.id || ""} disabled className="font-mono text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            More settings will be available in future updates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
