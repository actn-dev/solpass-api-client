"use client";

import { useMode } from "@/lib/hooks/use-mode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";


const USERS = [
  { value: "admin", label: "Shop Admin", description: "Event creator & platform owner", color: "bg-blue-500" },
  { value: "user1", label: "User 1", description: "Ticket buyer", color: "bg-green-500" },
  { value: "user2", label: "User 2", description: "Ticket buyer", color: "bg-purple-500" },
  { value: "user3", label: "User 3", description: "Ticket buyer", color: "bg-orange-500" },
];

export function UserSwitcher() {
  const { mode, setMode } = useMode();

  const currentUser = USERS.find((u) => u.value === mode) || USERS[0];

  return (
    <Card className="p-3 shadow-lg w-52">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Switch User</p>
      <Select value={mode} onValueChange={setMode}>
        <SelectTrigger className="w-full h-9 gap-2 focus:ring-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentUser.color}`} />
            <span className="font-medium text-sm truncate">{currentUser.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent position="popper" side="top" align="end">
          {USERS.map((user) => (
            <SelectItem key={user.value} value={user.value}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${user.color}`} />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{user.label}</span>
                  <span className="text-xs text-muted-foreground">{user.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{currentUser.description}</p>
    </Card>
  );
}
