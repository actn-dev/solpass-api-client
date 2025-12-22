"use client";

import { useMode } from "@/lib/hooks/use-mode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

export function UserSwitcher() {
  const { mode, setMode } = useMode();

  const users = [
    { value: "admin", label: "Shop Admin", description: "Event creator & platform owner" },
    { value: "user1", label: "User 1", description: "Ticket buyer" },
    { value: "user2", label: "User 2", description: "Ticket buyer" },
    { value: "user3", label: "User 3", description: "Ticket buyer" },
  ];

  const currentUser = users.find((u) => u.value === mode) || users[0];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Current User</p>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue>
                <span className="font-medium">{currentUser.label}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.value} value={user.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.label}</span>
                    <span className="text-xs text-muted-foreground">{user.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">{currentUser.description}</p>
        </div>
      </div>
    </Card>
  );
}
