import { useState } from "react";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { LoginArea } from "@/components/auth/LoginArea";
import { countLeadingZeroBits, formatPowDifficulty } from "@/lib/powUtils";
import { getEventHash } from "nostr-tools";

export const CreatePowNote = () => {
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [targetDifficulty, setTargetDifficulty] = useState(8);
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultId, setResultId] = useState("");
  
  const handleMine = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to create notes",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Empty content",
        description: "Please enter some content for your note",
        variant: "destructive",
      });
      return;
    }
    
    setMining(true);
    setProgress(0);
    setResultId("");
    
    try {
      const startTime = Date.now();
      let nonce = 0;
      let found = false;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(99, elapsed / 100)); 
      }, 100);
      
      // Mining loop to find a nonce that produces the desired difficulty
      while (!found && nonce < 1000000) {
        // Create an unsigned event
        const unsignedEvent = {
          kind: 1,
          content: content,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["nonce", nonce.toString(), targetDifficulty.toString()]],
          pubkey: user.pubkey,
        };
        
        // Create the event ID to check its difficulty
        // We use getEventHash from nostr-tools directly
        const id = getEventHash(unsignedEvent);
        const difficulty = countLeadingZeroBits(id);
        
        if (difficulty >= targetDifficulty) {
          found = true;
          // Now publish the event with the successful nonce
          await publish({
            kind: 1,
            content: content,
            tags: [["nonce", nonce.toString(), targetDifficulty.toString()]],
          });
          setResultId(id);
          break;
        }
        
        nonce++;
        // Every 10000 attempts, update progress
        if (nonce % 10000 === 0) {
          setProgress(Math.min(99, nonce / 10000));
        }
      }
      
      clearInterval(interval);
      setMining(false);
      setProgress(100);
      
      if (!found) {
        toast({
          title: "Mining timeout",
          description: "Could not find a solution within the attempt limit. Try a lower difficulty.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: `Successfully mined and published a note with difficulty ${targetDifficulty}`,
        });
      }
    } catch (error) {
      setMining(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mine PoW note",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create PoW Note</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create your own note with Proof of Work (NIP-13)
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Mine a Nostr Note</CardTitle>
          <CardDescription>
            Add computational proof of work to your note by finding an event ID hash with the specified number of leading zero bits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user ? (
            <div className="text-center py-4">
              <p className="mb-4 text-muted-foreground">
                Please log in to create PoW notes
              </p>
              <LoginArea className="mx-auto" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="content">Note Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={mining}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="difficulty">Target Difficulty</Label>
                  <Badge variant="outline">
                    {formatPowDifficulty(targetDifficulty)}
                  </Badge>
                </div>
                <Slider
                  id="difficulty"
                  min={1}
                  max={32}
                  step={1}
                  value={[targetDifficulty]}
                  onValueChange={(vals) => setTargetDifficulty(vals[0])}
                  disabled={mining}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Easier (1)</span>
                  <span>Harder (32)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher difficulty requires more computational work. Each additional bit doubles the required work.
                </p>
              </div>
              
              {mining && (
                <div className="space-y-2">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Mining... This may take a while depending on the target difficulty.
                  </p>
                </div>
              )}
              
              {resultId && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Successfully mined event:</p>
                  <p className="text-xs font-mono break-all">{resultId}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleMine}
            disabled={!user || mining || !content.trim()}
          >
            {mining ? "Mining..." : "Mine PoW Note"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">About Proof of Work in Nostr</h3>
        <p>
          Proof of Work in Nostr is defined in NIP-13. For more information, check the{' '}
          <a 
            href="https://github.com/nostr-protocol/nips/blob/master/13.md"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            NIP-13 specification
          </a>.
        </p>
      </div>
    </div>
  );
};