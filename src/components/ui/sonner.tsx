import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useResolvedTheme } from "@/lib/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedTheme()

  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)", left: 16, right: 16 }}
      duration={4000}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--ink)",
          "--normal-text": "var(--bg)",
          "--normal-border": "transparent",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!font-sans !text-[15px] !shadow-[var(--shadow-float)] !py-3 !px-4 !gap-3",
          actionButton: "!bg-saffron !text-on-saffron !font-semibold !rounded-lg !h-9 !px-3 !text-[14px]",
          title: "!font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
