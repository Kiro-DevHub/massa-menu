import * as React from "react"
import { cn } from "@/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"

// Сегмент в духе iOS: подложка surface-2, активный сегмент — карточка.
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex h-11 w-full items-stretch rounded-[13px] bg-surface-2 p-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[15px] font-semibold whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-200 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-saffron data-[state=active]:bg-[var(--seg-on)] data-[state=active]:text-ink data-[state=active]:shadow-[var(--shadow-card)] [&_svg]:size-[18px] [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
