"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth-schema";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyDisplayModal } from "@/components/auth/api-key-display-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);
      setApiKey(result.apiKey);
      setShowApiKeyModal(true);
    } catch (error) {
      // Error is handled in the auth hook with toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowApiKeyModal(false);
    router.push("/auth/login");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Partner Account</CardTitle>
          <CardDescription>
            Register to start managing your events
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletAddress">Solana Wallet Address</Label>
              <Input
                id="walletAddress"
                type="text"
                placeholder="Your Solana wallet address"
                {...register("walletAddress")}
                disabled={isLoading}
              />
              {errors.walletAddress && (
                <p className="text-sm text-destructive">
                  {errors.walletAddress.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                32-44 character Solana wallet address
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {apiKey && (
        <ApiKeyDisplayModal
          apiKey={apiKey}
          open={showApiKeyModal}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
