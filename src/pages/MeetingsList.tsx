
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meeting-card";
import { api, Meeting } from "@/services/api";
import { Wand2, Plus } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Spinner } from "@/components/ui/spinner";

export default function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMeetings();
        // Sort by uploadDate (newest first)
        data.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setMeetings(data);
        setError(null);
      } catch (err) {
        setError("Failed to load meetings. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();

    // Polling for status updates (in a real app, this could be websockets instead)
    const intervalId = setInterval(fetchMeetings, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <PageLayout>
      <div className="container px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Your Meetings</h2>
          <Button asChild>
            <Link to="/">
              <Plus className="mr-2 h-4 w-4" /> New Upload
            </Link>
          </Button>
        </div>

        {isLoading && meetings.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" text="Loading meetings..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-700">
            {error}
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">No meetings yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first meeting audio to get started.
            </p>
            <Button asChild>
              <Link to="/">Upload Meeting</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
