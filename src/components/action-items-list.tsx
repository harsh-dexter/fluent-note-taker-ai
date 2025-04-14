
import { ActionItem } from "@/services/api";
import { CheckSquare, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItemsListProps {
  items: ActionItem[];
  className?: string;
}

export function ActionItemsList({ items, className }: ActionItemsListProps) {
  if (items.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        No action items found
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-medium text-lg flex items-center">
        <CheckSquare className="w-5 h-5 mr-2 text-primary" />
        Action Items ({items.length})
      </h3>
      
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 p-3 bg-accent rounded-md">
            <div className="mt-0.5 text-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                {item.assignee && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {item.assignee}
                  </span>
                )}
                {item.dueDate && (
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {item.dueDate}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
