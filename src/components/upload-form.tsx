
import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress"; // Removed Progress
import { Input } from "@/components/ui/input";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api, Meeting } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface UploadFormProps {
  onUploadComplete?: (meeting: Meeting) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [uploadProgress, setUploadProgress] = useState(0); // Removed Progress state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus("idle");
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadStatus("uploading");
      // setUploadProgress(0); // Removed Progress state update

      // Call the updated API function (no progress callback)
      const meeting = await api.uploadMeeting(selectedFile);

      setUploadStatus("success");
      
      if (onUploadComplete) {
        onUploadComplete(meeting);
      }
      
      // Navigate to the meetings list after successful upload
      setTimeout(() => {
        navigate("/meetings");
      }, 1500);
      
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage((error as Error).message || "Upload failed. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    // setUploadProgress(0); // Removed Progress state reset
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const statusDisplay = {
    idle: null,
    uploading: (
      <div className="flex items-center space-x-2 text-sm text-blue-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Uploading...</span>
      </div>
    ),
    success: (
      <div className="flex items-center space-x-2 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        <span>Upload complete! Redirecting to meetings...</span>
      </div>
    ),
    error: (
      <div className="flex items-center space-x-2 text-sm text-red-700">
        <AlertCircle className="h-4 w-4" />
        <span>{errorMessage || "An unknown error occurred"}</span>
      </div>
    ),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <div className="text-lg font-medium">Upload Meeting Audio</div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedFile ? selectedFile.name : "Click to select an audio file or drag and drop"}
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploadStatus === "uploading"}
          />
        </div>
        
        {/* Removed Progress bar display */}
        {uploadStatus !== "idle" && (
          <div className="mt-4 space-y-2">
            {statusDisplay[uploadStatus]}
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={!selectedFile || uploadStatus === "uploading" || uploadStatus === "success"}
          className="flex-1"
        >
          {uploadStatus === "uploading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            "Upload Audio"
          )}
        </Button>
        {selectedFile && uploadStatus !== "uploading" && (
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </form>
  );
}
