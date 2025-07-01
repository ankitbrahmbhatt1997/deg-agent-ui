import type { ConnectionStatus } from "../types/chat"
import { Send, Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface ConnectionStatusProps {
  status: ConnectionStatus
  isLoading?: boolean
}

export function ConnectionStatusIndicator({ status, isLoading }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: "Sending...",
        className: "text-blue-600 bg-blue-50 border-blue-200",
      }
    }

    switch (status.status) {
      case "idle":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Ready",
          className: "text-green-600 bg-green-50 border-green-200",
        }
      case "sending":
        return {
          icon: <Send className="w-4 h-4" />,
          text: "Sending...",
          className: "text-blue-600 bg-blue-50 border-blue-200",
        }
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: "Error",
          className: "text-red-600 bg-red-50 border-red-200",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm ${config.className}`}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
      <span className="sm:hidden">
        {status.status === "idle" ? "●" : status.status === "sending" || isLoading ? "○" : "×"}
      </span>
    </div>
  )
}
