import { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { NoteContent } from "@/components/NoteContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { countLeadingZeroBits, formatPowDifficulty, getTargetDifficulty, getPowColorClass } from "@/lib/powUtils";
import { genUserName } from "@/lib/genUserName";
import { formatDistanceToNow } from "date-fns";

interface PowNoteCardProps {
  event: NostrEvent;
}

export const PowNoteCard = ({ event }: PowNoteCardProps) => {
  const author = useAuthor(event.pubkey);
  const authorMetadata = author.data?.metadata;
  
  // Calculate PoW difficulty
  const difficulty = countLeadingZeroBits(event.id);
  const targetDifficulty = getTargetDifficulty(event.tags);
  const powColorClass = getPowColorClass(difficulty);
  
  const displayName = authorMetadata?.name || genUserName(event.pubkey);
  const profileImage = authorMetadata?.picture;
  const createdAt = new Date(event.created_at * 1000);
  
  // Find the nonce tag for display
  const nonceTag = event.tags.find(tag => tag[0] === 'nonce');
  const nonceValue = nonceTag ? nonceTag[1] : "unknown";

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
              <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`${powColorClass}`}>
                  PoW: {difficulty} bits
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-sm">
                  <p><strong>Difficulty:</strong> {formatPowDifficulty(difficulty)}</p>
                  {targetDifficulty !== undefined && (
                    <p><strong>Target:</strong> {formatPowDifficulty(targetDifficulty)}</p>
                  )}
                  <p><strong>Nonce:</strong> {nonceValue}</p>
                  <p className="text-xs mt-2">According to NIP-13, higher difficulty means more computational work was done to create this note.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="whitespace-pre-wrap break-words">
          <NoteContent event={event} className="text-sm" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="inline-flex items-center">
            <span className="mr-1">Event ID:</span>
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {event.id.substring(0, 10)}...{event.id.substring(event.id.length - 4)}
            </code>
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};