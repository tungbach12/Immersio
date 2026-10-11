import type { ReactNode } from "react";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ContentStateProps {
  title?: string;
  description: string;
  loading?: boolean;
  onRetry?: () => void;
  children?: ReactNode;
}

export function ContentState({
  title,
  description,
  loading,
  onRetry,
  children,
}: ContentStateProps) {
  return (
    <div
      className="workspace-state"
      role={loading ? "status" : undefined}
      aria-live="polite"
    >
      {loading ? (
        <Loader2 size={27} className="animate-spin" />
      ) : (
        <BookOpen size={27} />
      )}
      {title && <h3>{title}</h3>}
      <p>{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} className="mr-2" />
          Try again
        </Button>
      )}
      {children}
    </div>
  );
}
