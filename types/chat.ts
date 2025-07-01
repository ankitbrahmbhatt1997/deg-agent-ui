export interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
}

export interface ChatResponse {
  status: string
  message: {
    output: string
  }
  error?: string
}

export interface ChatRequest {
  message: string
}

export interface ConnectionStatus {
  status: "idle" | "sending" | "error"
  lastActivity?: Date
}
