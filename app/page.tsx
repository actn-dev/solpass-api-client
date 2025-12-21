"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await apiClient.GET("/api/v1/events");
      if (response.error) throw new Error("Failed to fetch events");
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">
          Events
        </h1>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading events...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="font-semibold">Error loading events</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(data) && data.length > 0 ? (
              data.map((event: any) => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-zinc-900 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-zinc-200 dark:border-zinc-800"
                >
                  <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                    {event.name}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500">📍</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500">📅</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500">🎫</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {event.totalTickets} tickets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-500">💰</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                        ${(event.ticketPrice / 100).toFixed(2)}
                      </span>
                    </div>
                    {event.blockchainEnabled && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                        <span>⛓️</span>
                        <span>Blockchain Enabled</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-zinc-600 dark:text-zinc-400">
                <p className="text-lg">No events found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
