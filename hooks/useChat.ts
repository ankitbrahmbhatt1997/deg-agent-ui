"use client"

import { useState, useEffect, useCallback } from "react"
import type { Message, ConnectionStatus } from "../types/chat"
import { useAuth } from "../contexts/auth-context"

const STORAGE_KEY = "solar_chat_messages"
const CONVERSATION_KEY = "solar_conversation_id"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "idle",
  })
  const [conversationId, setConversationId] = useState<string | null>(null)

  const { user, token } = useAuth()

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    const savedConversationId = localStorage.getItem(CONVERSATION_KEY)

    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedMessages)
      } catch (error) {
        console.error("Error loading saved messages:", error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    if (savedConversationId) {
      setConversationId(savedConversationId)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Save conversation ID whenever it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_KEY, conversationId)
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      console.log("💬 Sending message:", content)
      console.log("🔑 Using token:", token ? "EXISTS" : "MISSING")
      console.log("👤 User ID:", user?.id)

      // Create user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        content: content.trim(),
        role: "user",
        timestamp: new Date(),
      }

      // Add user message to state immediately
      setMessages((prev) => [...prev, userMessage])
      setConnectionStatus({ status: "sending", lastActivity: new Date() })

      try {
        // Generate session ID for local tracking only
        const sessionId = conversationId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Prepare request payload
        const requestPayload = {
          message: content.trim(),
        }

        console.log("📤 Request payload:", requestPayload)
        console.log("🔗 Local session ID (not sent):", sessionId)
        console.log("🌐 API URL:", "https://api-deg-agents.becknprotocol.io/api/ai/chat")
        // console.log("🔑 Authorization header:", `Bearer ${token?.substring(0, 20)}...`)

        // --- OLD (kept for context)
        // const response = await fetch("https://api-deg-agents.becknprotocol.io/api/ai/chat", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${token}`,   // ⬅️  removed
        //   },
        //   body: JSON.stringify(requestPayload),
        // })

        // --- NEW ---
        const chatUrl =
          "https://api-deg-agents.becknprotocol.io/api/ai/chat" + `?access_token=${encodeURIComponent(token ?? "")}`

        console.log("🌐 Final chat URL:", chatUrl)

        const response = await fetch(chatUrl, {
          method: "POST",
          // Only a *simple* header -> avoids CORS pre-flight issues
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        })

        console.log("📥 Response status:", response.status)
        console.log("📥 Response ok:", response.ok)
        console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))

        // Log the raw response text first
        const responseText = await response.text()
        console.log("📄 RAW RESPONSE TEXT:", responseText)

        // Try to parse as JSON
        let data
        try {
          data = JSON.parse(responseText)
          console.log("📄 PARSED RESPONSE DATA:", data)
        } catch (parseError) {
          console.error("❌ Failed to parse response as JSON:", parseError)
          throw new Error("Invalid JSON response from server")
        }

        if (response.ok && data.status === "success" && data.message?.output) {
          // Set conversation ID if it's new (for local tracking only)
          if (!conversationId) {
            setConversationId(sessionId)
          }

          // Extract the message content from the specific API format
          const assistantContent = data.message.output

          console.log("🤖 Assistant response:", assistantContent)

          // Add assistant message
          const assistantMessage: Message = {
            id: `assistant_${Date.now()}`,
            content: assistantContent,
            role: "assistant",
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, assistantMessage])
          setConnectionStatus({ status: "idle", lastActivity: new Date() })
        } else {
          console.log("❌ Chat API failed:", data)

          // Handle error response
          let errorMessage = "Sorry, I encountered an error. Please try again."

          if (data?.error) {
            errorMessage = data.error
          } else if (data?.message && typeof data.message === "string") {
            errorMessage = data.message
          } else if (!response.ok) {
            errorMessage = `Server error (${response.status}). Please try again.`
          } else if (data.status !== "success") {
            errorMessage = "The AI service returned an unexpected response. Please try again."
          }

          const errorMessageObj: Message = {
            id: `error_${Date.now()}`,
            content: errorMessage,
            role: "assistant",
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, errorMessageObj])
          setConnectionStatus({ status: "error", lastActivity: new Date() })
        }
      } catch (error) {
        console.error("💥 Chat API error:", error)

        let errorMessage = "Network error. Please check your connection and try again."

        if (error instanceof Error) {
          console.log("🔍 Error details:", error.message)
          console.log("🔍 Error name:", error.name)
          console.log("🔍 Error stack:", error.stack)

          if (error.message.includes("fetch")) {
            errorMessage = "Unable to connect to chat service. Please try again later."
          } else if (error.message.includes("JSON")) {
            errorMessage = "Invalid response from chat service. Please try again."
          } else if (error.message.includes("CORS")) {
            errorMessage = "CORS error - the chat service is blocking this request."
          } else if (error.message.includes("Failed to fetch")) {
            errorMessage = "Network request failed. This might be a CORS issue or network connectivity problem."
          }
        }

        // Add error message
        const errorMessageObj: Message = {
          id: `error_${Date.now()}`,
          content: errorMessage,
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessageObj])
        setConnectionStatus({ status: "error", lastActivity: new Date() })
      }
    },
    [conversationId, user?.id, token],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CONVERSATION_KEY)
  }, [])

  const retryLastMessage = useCallback(() => {
    if (messages.length >= 2) {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user")

      if (lastUserMessage) {
        sendMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendMessage])

  return {
    messages,
    connectionStatus,
    conversationId,
    sendMessage,
    clearMessages,
    retryLastMessage,
    isLoading: connectionStatus.status === "sending",
  }
}
