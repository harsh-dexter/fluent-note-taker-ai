
/**
 * API service for the Meeting Note-Taker application
 * This service handles all communication with the backend API
 */

// Base URL for the FastAPI backend
const BASE_URL = "http://localhost:8000"; // Assuming backend runs on port 8000

// Types
export interface Meeting { // Keep existing type, but note backend might return different structure initially
  id: string;
  filename: string;
  uploadDate: string; // Consider using Date type if preferred
  status: "processing" | "completed" | "error";
  language?: string; // Add if returned/used from ASR
  duration?: string; // Add if calculated/stored
  summary?: string;
  actionItems?: ActionItem[];
  decisions?: ActionItem[]; // Add decisions field (using ActionItem structure for now)
  error?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName?: string;
  startTime: number;
  endTime: number;
  text: string;
  language?: string;
}

export interface SearchResult {
  segmentId: string;
  text: string;
  matchPositions: [number, number][];
} // <-- Added missing closing brace

// Helper function for handling API errors
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch (jsonError) {
      // Ignore if response is not JSON
    }
    throw new Error(errorDetail);
  }
  return response.json() as Promise<T>;
}

// API Functions
export const api = {
  uploadMeeting: async (file: File): Promise<Meeting> => {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch(`${BASE_URL}/upload/upload-audio`, {
      method: "POST",
      body: formData,
    });

    // Use helper to handle potential errors and parse JSON
    const result = await handleApiResponse<{ job_id: string; filename: string; message: string }>(response);

    // Return a partial Meeting object representing the processing state
    return {
      id: result.job_id,
      filename: result.filename,
      uploadDate: new Date().toISOString(),
      status: "processing",
    };
  },

  // Get all meetings (Needs backend implementation)
  // This currently returns mock data. Replace with a call to a backend endpoint
  // that lists meetings from the database (e.g., GET /meetings/)
  getMeetings: async (): Promise<Meeting[]> => {
    console.warn("getMeetings API call is using mock data. Implement backend endpoint.");
    // Example backend call:
    const response = await fetch(`${BASE_URL}/meetings/`); // Needs backend endpoint implementation
    const data = await handleApiResponse<any[]>(response); // Define backend return type properly
    // TODO: Map backend data structure to frontend Meeting type
    // return data.map(item => ({ ... map backend item to Meeting type ... }));
    return []; // Return empty array until backend endpoint is implemented
  },

  // Get a single meeting by ID (job_id)
  getMeeting: async (id: string): Promise<Meeting> => {
    // This endpoint fetches summary, actions, decisions
    const response = await fetch(`${BASE_URL}/meetings/summary/${id}`);
    const data = await handleApiResponse<{
      job_id: string;
      summary: string | null;
      action_items: string[];
      decisions: string[];
    }>(response);

    // Fetch full meeting data to get other details like filename, timestamp
    // Alternatively, the summary endpoint could return all necessary fields
    const fullDataResponse = await fetch(`${BASE_URL}/meetings/json/${id}`); // Use JSON export
    const fullData = await handleApiResponse<any>(fullDataResponse); // Use 'any' or define a more specific type

    // Combine data - Need to determine final status based on content/errors
    let status: Meeting["status"] = "processing"; // Default assumption
    if (data.summary && !data.summary.startsWith("Error")) {
        status = "completed";
    } else if (data.summary?.startsWith("Error")) {
        status = "error";
    }

    return {
      id: data.job_id,
      filename: fullData.filename || 'N/A',
      uploadDate: fullData.timestamp || new Date().toISOString(), // Use DB timestamp
      status: status,
      summary: data.summary || undefined,
      actionItems: data.action_items?.map((desc, index) => ({ id: `${id}-action-${index}`, description: desc })) || [],
      decisions: data.decisions?.map((desc, index) => ({ id: `${id}-decision-${index}`, description: desc })) || [], // Now valid field
      error: status === "error" ? data.summary : undefined,
      language: fullData.language || undefined, // Get language if available
      // duration would need calculation or backend storage
    };
  },

  // Get transcript for a meeting (job_id)
  // Note: Backend returns { job_id: string, transcript: string }
  // Frontend expects TranscriptSegment[]. Needs adaptation or backend change.
  getTranscript: async (meetingId: string): Promise<TranscriptSegment[]> => {
    console.warn("getTranscript API needs adaptation: backend returns raw text, frontend expects segments.");
    const response = await fetch(`${BASE_URL}/meetings/transcript/${meetingId}`);
    const data = await handleApiResponse<{ job_id: string; transcript: string | null }>(response);

    if (!data.transcript) {
        return [];
    }
    // --- Placeholder Adaptation ---
    // Split raw transcript into mock segments for now.
    // Real implementation needs backend to return segments or frontend to parse.
    const lines = data.transcript.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => ({
        id: `${meetingId}-segment-${index}`,
        speakerId: `speaker-unknown`, // Backend doesn't provide this yet
        startTime: index * 5, // Mock time
        endTime: (index + 1) * 5, // Mock time
        text: line,
    }));
    // return []; // Return empty until backend/frontend adapted
  },

  // Search across ALL transcripts (global search)
  // Note: Backend returns full meeting records matching the query.
  // Frontend expects SearchResult[]. Needs adaptation.
  searchTranscript: async (query: string): Promise<SearchResult[]> => {
      console.warn("searchTranscript API needs adaptation: backend returns full meetings, frontend expects segments/snippets.");
      if (!query) return [];
      const response = await fetch(`${BASE_URL}/meetings/search/?query=${encodeURIComponent(query)}`);
      const data = await handleApiResponse<{ query: string; results: any[] }>(response); // Backend returns list of full meeting dicts

      // --- Placeholder Adaptation ---
      // Create mock SearchResult from the first matching meeting's transcript
      const results: SearchResult[] = [];
      if (data.results && data.results.length > 0) {
          const firstMatch = data.results[0];
          const transcript = firstMatch.transcript || "";
          const lowerQuery = query.toLowerCase();
          const lowerText = transcript.toLowerCase();
          const matchPos = lowerText.indexOf(lowerQuery);
          if (matchPos !== -1) {
              results.push({
                  segmentId: `${firstMatch.job_id}-search-result`, // Mock ID
                  text: transcript.substring(Math.max(0, matchPos - 30), Math.min(transcript.length, matchPos + lowerQuery.length + 30)), // Snippet
                  matchPositions: [[matchPos, matchPos + lowerQuery.length]] // Simplified
              });
          }
      }
      return results;
      // return []; // Return empty until backend/frontend adapted
  },

  // Export meeting report as PDF
  exportMeetingReport: async (meetingId: string, includeTranscript: boolean = true): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/meetings/pdf/${meetingId}?include_transcript=${includeTranscript}`);
    if (!response.ok) {
        // Handle error similarly to handleApiResponse, but expect Blob on success
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorDetail);
    }
    // Return the response body directly as a Blob
    return response.blob();
  }
};
