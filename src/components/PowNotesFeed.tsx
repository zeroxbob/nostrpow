import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNostr } from "@nostrify/react";
import { NostrEvent } from "@nostrify/nostrify";
import { PowNoteCard } from "@/components/PowNoteCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RelaySelector } from "@/components/RelaySelector";
import { countLeadingZeroBits } from "@/lib/powUtils";

const ITEMS_PER_PAGE = 10;

export const PowNotesFeed = () => {
  const { nostr } = useNostr();
  const [page, setPage] = useState(1);
  const [minDifficulty, setMinDifficulty] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["pow-notes", minDifficulty],
    queryFn: async ({ signal }) => {
      // Create a timeout signal for the query
      const timeoutSignal = AbortSignal.timeout(10000);
      const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

      // Modified approach to fetch notes with potential PoW
      // 1. First try to fetch notes with nonce tags
      // 2. Then fetch recent notes and check their difficulty
      let fetchedEvents: NostrEvent[] = [];

      try {
        // Try with nonce tag filter first
        const nonceEvents = await nostr.query([
          {
            kinds: [1], // Text notes
            limit: 100,
            "#nonce": [], // Events with nonce tag
          }
        ], { signal: combinedSignal });

        fetchedEvents = [...nonceEvents];

        // Also fetch recent notes without the nonce filter
        const recentEvents = await nostr.query([
          {
            kinds: [1], // Text notes
            limit: 200,
            since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30 // Last 30 days
          }
        ], { signal: combinedSignal });

        // Combine all events, removing duplicates
        const allEventIds = new Set(fetchedEvents.map(e => e.id));
        for (const event of recentEvents) {
          if (!allEventIds.has(event.id)) {
            fetchedEvents.push(event);
            allEventIds.add(event.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
        // Fallback to just recent events if the first query fails
        fetchedEvents = await nostr.query([
          {
            kinds: [1], // Text notes
            limit: 200,
            since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30 // Last 30 days
          }
        ], { signal: combinedSignal });
      }

      // Filter events with minimum difficulty
      return fetchedEvents.filter(event => countLeadingZeroBits(event.id) >= minDifficulty);
    },
  });

  // Sort events by PoW difficulty
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const diffA = countLeadingZeroBits(a.id);
      const diffB = countLeadingZeroBits(b.id);
      return sortOrder === "desc" ? diffB - diffA : diffA - diffB;
    });
  }, [events, sortOrder]);

  // Paginate the results
  const paginatedEvents = useMemo(() => {
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    return sortedEvents.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedEvents, page]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / ITEMS_PER_PAGE));

  // Handle difficulty change
  const handleDifficultyChange = (value: string) => {
    setMinDifficulty(parseInt(value, 10));
    setPage(1); // Reset to first page when changing filter
  };

  // Handle sort order change 
  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as "desc" | "asc");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nostr PoW Explorer</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover notes with Proof of Work (NIP-13) sorted by difficulty.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label htmlFor="minDifficulty" className="text-sm font-medium mb-1 block">
              Minimum Difficulty
            </label>
            <Select value={minDifficulty.toString()} onValueChange={handleDifficultyChange}>
              <SelectTrigger id="minDifficulty" className="w-full sm:w-32">
                <SelectValue placeholder="Min PoW" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">≥ 1 bit</SelectItem>
                <SelectItem value="8">≥ 8 bits</SelectItem>
                <SelectItem value="16">≥ 16 bits</SelectItem>
                <SelectItem value="20">≥ 20 bits</SelectItem>
                <SelectItem value="24">≥ 24 bits</SelectItem>
                <SelectItem value="28">≥ 28 bits</SelectItem>
                <SelectItem value="32">≥ 32 bits</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="sortOrder" className="text-sm font-medium mb-1 block">
              Sort Order
            </label>
            <Select value={sortOrder} onValueChange={handleSortOrderChange}>
              <SelectTrigger id="sortOrder" className="w-full sm:w-40">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Highest First</SelectItem>
                <SelectItem value="asc">Lowest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">
            Relay
          </label>
          <RelaySelector className="w-full sm:w-56" />
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="mb-6 w-full"
        onClick={() => refetch()}
      >
        Refresh Notes
      </Button>

      {isLoading ? (
        // Loading state
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[92%]" />
                  <Skeleton className="h-4 w-[88%]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        // Error state
        <Card className="border-dashed border-red-300">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <p className="text-red-500 font-medium">
                Failed to load PoW notes
              </p>
              <p className="text-muted-foreground text-sm">
                Try another relay or check your connection.
              </p>
              <div className="pt-2">
                <RelaySelector className="w-full" />
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : sortedEvents.length === 0 ? (
        // Empty state
        <div className="col-span-full">
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <p className="text-muted-foreground">
                  No notes with PoW found. Try the following:
                </p>
                <ul className="text-left text-muted-foreground space-y-2 mb-4">
                  <li>• Switch to relays like <code className="text-xs">wss://relay.damus.io</code> or <code className="text-xs">wss://nostr.wine</code></li>
                  <li>• Lower the minimum difficulty filter</li>
                  <li>• Create your own PoW note to experiment</li>
                </ul>
                <RelaySelector className="w-full" />
                <Button asChild variant="outline" className="w-full mt-4">
                  <a href="/create">Create Your Own PoW Note</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Notes found
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {sortedEvents.length} notes with PoW ≥ {minDifficulty} bits
          </div>
          
          <div className="space-y-4">
            {paginatedEvents.map((event: NostrEvent) => (
              <PowNoteCard key={event.id} event={event} />
            ))}
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <span className="flex items-center text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};