
import { UploadForm } from "@/components/upload-form";
import { ListChecks, FileAudio, Search, Download } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";

export default function Home() {
  return (
    <PageLayout>
      <div className="container px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Transform your meetings with AI
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload audio from your meetings and let our AI generate summaries, action items, and searchable transcripts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <FileAudio className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Multilingual Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Process recordings in multiple languages with accurate transcription
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <ListChecks className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Extract Action Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically identify and organize action items from your meetings
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Searchable Transcripts</h3>
                  <p className="text-sm text-muted-foreground">
                    Find important information quickly with full-text search
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Export Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Download formatted reports with summaries and action items
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm relative animate-fade-in">
            <div className="absolute -top-3 -right-3 bg-primary text-white text-sm font-medium py-1 px-3 rounded-full">
              New
            </div>
            <h2 className="text-xl font-semibold mb-4 text-center">Upload Meeting Audio</h2>
            <UploadForm />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
