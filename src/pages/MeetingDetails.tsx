
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { ActionItemsList } from "@/components/action-items-list";
import { SearchBar } from "@/components/search-bar";
import { api, Meeting, TranscriptSegment, SearchResult } from "@/services/api";
import { ChevronLeft, Download, Calendar, Clock, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageLayout } from "@/components/layout/page-layout";
import { Spinner } from "@/components/ui/spinner";

export default function MeetingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchMeetingDetails = async () => {
      try {
        setIsLoading(true);
        const meetingData = await api.getMeeting(id);
        setMeeting(meetingData);
        setError(null);
        
        // If meeting is completed, fetch the transcript
        if (meetingData.status === "completed") {
          await fetchTranscript(id);
        }
      } catch (err) {
        setError(`Failed to load meeting details: ${(err as Error).message}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingDetails();

    // Poll for updates if meeting is processing
    const intervalId = setInterval(async () => {
      if (meeting && meeting.status === "processing") {
        await fetchMeetingDetails();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [id, meeting?.status]);

  const fetchTranscript = async (meetingId: string) => {
    try {
      setIsTranscriptLoading(true);
      const transcriptData = await api.getTranscript(meetingId);
      setTranscript(transcriptData);
    } catch (err) {
      console.error("Failed to load transcript:", err);
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!id || !query.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await api.searchTranscript(id, query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    
    try {
      setIsExporting(true);
      const pdfBlob = await api.exportMeetingReport(id);
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-summary-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" text="Loading meeting details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md w-full text-center">
          <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/meetings")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Meetings
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-6 max-w-md w-full text-center">
          <h2 className="text-lg font-medium text-amber-800 mb-2">Meeting Not Found</h2>
          <p className="text-amber-700 mb-4">
            The meeting you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/meetings">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Meetings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(meeting.uploadDate).toLocaleDateString();
  const timeAgo = formatDistanceToNow(new Date(meeting.uploadDate), { addSuffix: true });

  return (
    <PageLayout>
      <div className="container px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/meetings">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Meetings
            </Link>
          </Button>
          
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{meeting.filename}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <StatusBadge status={meeting.status} />
                
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span title={formattedDate}>{timeAgo}</span>
                </div>
                
                {meeting.duration && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{meeting.duration}</span>
                  </div>
                )}
                
                {meeting.language && (
                  <div className="px-2 py-0.5 rounded-full bg-blue-100 text-xs font-medium text-blue-800">
                    {meeting.language}
                  </div>
                )}
              </div>
            </div>
            
            {meeting.status === "completed" && (
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="shrink-0"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Export PDF Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {meeting.status === "processing" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-amber-800 mb-1">Processing Your Meeting</h3>
            <p className="text-amber-700 mb-4">
              Our AI is currently analyzing your audio file. This may take a few minutes.
            </p>
            <p className="text-sm text-amber-600">
              You don't need to stay on this page. We'll save your results.
            </p>
          </div>
        ) : meeting.status === "error" ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <div className="h-6 w-6 text-red-600">⚠️</div>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-1">Processing Error</h3>
            <p className="text-red-700 mb-4">
              {meeting.error || "We encountered an error while processing your meeting audio."}
            </p>
            <Button asChild>
              <Link to="/">Try Uploading Again</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="border rounded-md bg-white">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Meeting Summary</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm whitespace-pre-line">{meeting.summary}</p>
                </div>
              </div>
              
              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="border rounded-md bg-white p-4">
                  <ActionItemsList items={meeting.actionItems} />
                </div>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <div className="mb-4">
                <SearchBar 
                  onSearch={handleSearch}
                  onClear={clearSearch}
                  placeholder="Search transcript..."
                  isSearching={isSearching}
                />
                {searchResults && (
                  <div className="mt-2 text-sm">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              <TranscriptViewer 
                transcript={transcript} 
                searchResults={searchResults || undefined}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
