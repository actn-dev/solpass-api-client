"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">SolPass API Client Demo</h1>
            <p className="text-muted-foreground">
              Third-party integration simulation for SolPass ticketing system
            </p>
          </div>

          {!isAuthenticated ? (
            <Alert variant="destructive">
              <AlertDescription>
                Authentication failed. Please check the API server.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <ModeSwitcher />

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Events Management</CardTitle>
                    <CardDescription>
                      View all events, create new events, and manage tickets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/events">
                      <Button className="w-full">Go to Events</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>How it Works</CardTitle>
                    <CardDescription>
                      This demo simulates a third-party ticket marketplace
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• <strong>Shop Admin:</strong> Create & manage events</li>
                      <li>• <strong>User 1:</strong> Buy and resell tickets</li>
                      <li>• <strong>User 2:</strong> Buy resold tickets</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
