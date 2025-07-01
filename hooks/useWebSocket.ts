"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Message, ConnectionStatus } from "../types/chat"

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "disconnected",
  })
  const [isTyping, setIsTyping] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus({ status: "connecting" })

    try {
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        setConnectionStatus({
          status: "connected",
          lastConnected: new Date(),
        })
        console.log("WebSocket connected")
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "typing_start") {
            setIsTyping(true)
          } else if (data.type === "typing_end") {
            setIsTyping(false)
          } else if (data.type === "message") {
            const newMessage: Message = {
              id: data.id || Date.now().toString(),
              content: data.content,
              role: data.role || "assistant",
              timestamp: new Date(data.timestamp || Date.now()),
              type: data.messageType || "text",
              metadata: data.metadata,
            }

            setMessages((prev) => [...prev, newMessage])
            setIsTyping(false)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      wsRef.current.onclose = () => {
        setConnectionStatus({ status: "disconnected" })
        setIsTyping(false)

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current.onerror = () => {
        setConnectionStatus({ status: "error" })
        setIsTyping(false)
      }
    } catch (error) {
      setConnectionStatus({ status: "error" })
      console.error("WebSocket connection error:", error)
    }
  }, [url])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
        type: "text",
      }

      setMessages((prev) => [...prev, message])

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          content,
          timestamp: message.timestamp.toISOString(),
          id: message.id,
        }),
      )
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    messages,
    connectionStatus,
    isTyping,
    sendMessage,
    connect,
    disconnect,
  }
}
