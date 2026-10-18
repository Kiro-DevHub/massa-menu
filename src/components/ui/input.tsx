import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 16px, чтобы iOS не зумил страницу при фокусе.
        "h-12 w-full min-w-0 rounded-[14px] border border-transparent bg-surface-2 px-3.5 text-[16px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-saffron focus-visible:ring-3 focus-visible:ring-saffron/25 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-bad aria-invalid:ring-3 aria-invalid:ring-bad/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
