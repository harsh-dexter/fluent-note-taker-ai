
import { TranscriptSegment, SearchResult } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  searchResults?: SearchResult[];
  isSearching?: boolean;
}

// Format seconds to mm:ss format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function TranscriptViewer({ transcript, searchResults, isSearching }: TranscriptViewerProps) {
  // Group transcript segments by speaker
  const groupedTranscript: { [speakerId: string]: TranscriptSegment[] } = {};
  
  transcript.forEach((segment) => {
    if (!groupedTranscript[segment.speakerId]) {
      groupedTranscript[segment.speakerId] = [];
    }
    groupedTranscript[segment.speakerId].push(segment);
  });

  // Check if a segment is in search results
  const getHighlightedText = (segment: TranscriptSegment) => {
    if (!searchResults) return segment.text;
    
    const result = searchResults.find(r => r.segmentId === segment.id);
    if (!result) return segment.text;
    
    // Sort positions to ensure we build the text correctly
    const positions = [...result.matchPositions].sort((a, b) => a[0] - b[0]);
    
    let highlightedText: JSX.Element[] = [];
    let lastIndex = 0;
    
    positions.forEach(([start, end], i) => {
      // Add text before the highlight
      if (start > lastIndex) {
        highlightedText.push(
          <span key={`text-${i}`}>{segment.text.substring(lastIndex, start)}</span>
        );
      }
      
      // Add highlighted text
      highlightedText.push(
        <span key={`highlight-${i}`} className="bg-yellow-200 rounded px-0.5">
          {segment.text.substring(start, end)}
        </span>
      );
      
      lastIndex = end;
    });
    
    // Add any remaining text
    if (lastIndex < segment.text.length) {
      highlightedText.push(
        <span key="text-end">{segment.text.substring(lastIndex)}</span>
      );
    }
    
    return highlightedText;
  };

  return (
    <div className="border rounded-md bg-white">
      <div className="p-3 border-b">
        <h3 className="font-medium">Meeting Transcript</h3>
      </div>
      
      <ScrollArea className="h-[500px] p-4">
        {isSearching ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            <span className="ml-2">Searching transcript...</span>
          </div>
        ) : transcript.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTranscript).map(([speakerId, segments]) => (
              <div key={speakerId} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {segments[0].speakerName?.[0] || "?"}
                  </div>
                  <span className="font-medium">{segments[0].speakerName || `Speaker ${speakerId}`}</span>
                </div>
                
                <div className="pl-10 space-y-2">
                  {segments.map((segment) => (
                    <div key={segment.id} className={cn(
                      "pl-3 border-l-2 py-1",
                      searchResults?.some(r => r.segmentId === segment.id) 
                        ? "border-yellow-400" 
                        : "border-gray-200"
                    )}>
                      <div className="text-xs text-gray-500 mb-1">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        {segment.language && segment.language !== "English" && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {segment.language}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{getHighlightedText(segment)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No transcript available yet.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
