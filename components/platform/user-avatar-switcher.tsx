"use client";

import { useMode, UserMode } from "@/lib/hooks/use-mode";

const USERS: {
    value: UserMode;
    initials: string;
    label: string;
    description: string;
    bg: string;
    ring: string;
}[] = [
        {
            value: "admin",
            initials: "A",
            label: "Shop Admin",
            description: "Event creator & platform owner",
            bg: "bg-blue-500",
            ring: "ring-blue-500",
        },
        {
            value: "user1",
            initials: "U1",
            label: "User 1",
            description: "Ticket buyer",
            bg: "bg-green-500",
            ring: "ring-green-500",
        },
        {
            value: "user2",
            initials: "U2",
            label: "User 2",
            description: "Ticket buyer",
            bg: "bg-purple-500",
            ring: "ring-purple-500",
        },
    ];

export function UserAvatarSwitcher() {
    const { mode, setMode } = useMode();

    return (
        <div className="flex flex-col items-center gap-2">
            {USERS.map((user) => {
                const isActive = mode === user.value;
                return (
                    <div key={user.value} className="relative group">
                        <button
                            onClick={() => setMode(user.value)}
                            className={[
                                "flex items-center justify-center rounded-full font-bold text-white transition-all select-none",
                                "text-[11px] leading-none",
                                isActive
                                    ? `h-10 w-10 ${user.bg} ring-2 ring-offset-2 ${user.ring} scale-110 shadow-md`
                                    : `h-8 w-8 ${user.bg} opacity-50 hover:opacity-90 hover:scale-105`,
                            ].join(" ")}
                            aria-label={`Switch to ${user.label}`}
                        >
                            {user.initials}
                        </button>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-popover text-popover-foreground border rounded-md shadow-md px-2.5 py-1.5 text-xs whitespace-nowrap">
                                <p className="font-semibold">{user.label}</p>
                                <p className="text-muted-foreground">{user.description}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

