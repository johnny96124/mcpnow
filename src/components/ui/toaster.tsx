
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, noBlock, className, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className={`${noBlock ? "pointer-events-none" : ""} ${className || ""}`}
          >
            <div className={`grid gap-1 ${noBlock ? "" : "pointer-events-auto"}`}>
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className={noBlock ? "pointer-events-auto" : ""} />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-0 right-0 flex flex-col p-4 sm:top-0 sm:right-0 sm:flex-col md:max-w-[420px] z-50" />
    </ToastProvider>
  )
}
