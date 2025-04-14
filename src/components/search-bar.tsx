
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>;
  onClear?: () => void;
  placeholder?: string;
  initialQuery?: string;
  isSearching?: boolean;
  className?: string;
}

export function SearchBar({
  onSearch,
  onClear,
  placeholder = "Search...",
  initialQuery = "",
  isSearching = false,
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await onSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className="pl-9 pr-7"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSearching}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={!searchQuery.trim() || isSearching}>
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
