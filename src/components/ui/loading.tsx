import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  message?: string
}

export function Loading({ className, message = "Loading..." }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-6 md:p-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
