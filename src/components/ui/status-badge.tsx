
import { cn } from "@/lib/utils";

type StatusType = "processing" | "completed" | "error";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    processing: {
      label: "Processing",
      class: "bg-amber-100 text-amber-800 border-amber-200 animate-pulse-subtle",
    },
    completed: {
      label: "Completed",
      class: "bg-green-100 text-green-800 border-green-200",
    },
    error: {
      label: "Error",
      class: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.class,
        className
      )}
    >
      {config.label}
    </span>
  );
}
