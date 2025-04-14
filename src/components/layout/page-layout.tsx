
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Wand2 className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">AI Meeting Note-Taker</h1>
          </div>
          <nav className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/meetings">View Meetings</Link>
            </Button>
            <Button asChild>
              <Link to="/">Upload New</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Meeting Note-Taker. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
