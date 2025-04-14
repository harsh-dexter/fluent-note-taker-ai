
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./ui/status-badge";
import { CalendarDays, Clock, FileAudio } from "lucide-react";
import { Meeting } from "@/services/api";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const formattedDate = new Date(meeting.uploadDate).toLocaleDateString();
  const timeAgo = formatDistanceToNow(new Date(meeting.uploadDate), { addSuffix: true });
  
  return (
    <Link to={`/meetings/${meeting.id}`} className="block transition-all hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium line-clamp-1 text-left">
              {meeting.filename}
            </CardTitle>
            <StatusBadge status={meeting.status} />
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
              <span title={formattedDate}>{timeAgo}</span>
            </div>
            {meeting.duration && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 opacity-70" />
                <span>{meeting.duration}</span>
              </div>
            )}
            {meeting.language && (
              <div className="flex items-center">
                <FileAudio className="h-4 w-4 mr-2 opacity-70" />
                <span>{meeting.language}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          {meeting.status === "completed" && (
            <p className="text-xs text-muted-foreground line-clamp-1 text-left">
              {meeting.summary?.substring(0, 100)}...
            </p>
          )}
          {meeting.status === "error" && (
            <p className="text-xs text-red-500">
              {meeting.error || "Processing error occurred"}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
