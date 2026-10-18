import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Все размеры дают тап-зону не меньше 44 px: у sm и icon-sm она расширена псевдоэлементом.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-150 outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-saffron text-on-saffron shadow-[0_1px_0_rgb(255_255_255/0.25)_inset] hover:brightness-105",
        ink: "bg-ink text-bg hover:bg-ink/90",
        outline: "border-line bg-surface text-ink hover:bg-surface-2",
        secondary: "bg-surface-2 text-ink hover:bg-surface-3",
        ghost: "text-ink hover:bg-surface-2",
        destructive: "bg-bad/12 text-bad hover:bg-bad/20",
        link: "text-saffron-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 text-[15px]",
        sm: "h-9 rounded-[10px] px-3 text-[14px] after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']",
        lg: "h-14 rounded-2xl px-5 text-[17px]",
        icon: "size-11",
        "icon-sm": "size-9 rounded-[10px] after:absolute after:-inset-1 after:content-['']",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
