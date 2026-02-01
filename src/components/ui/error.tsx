import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ErrorDisplayProps {
  className?: string
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorDisplay({
  className,
  title = "Something went wrong",
  message = "An error occurred while loading data.",
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center md:p-12",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-destructive">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "An unexpected error occurred"
}
