"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sun, RotateCcw, Trash2 } from "lucide-react"
import { useChat } from "./hooks/useChat"
import { ChatMessage } from "./components/message"
import { ConnectionStatusIndicator } from "./components/connection-status"
import { useAuth } from "./contexts/auth-context"

export default function SolarChatAgent() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { messages, connectionStatus, sendMessage, clearMessages, retryLastMessage, isLoading } = useChat()

  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
      setInput("")
    }
  }

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear all messages?")) {
      clearMessages()
    }
  }

  const handleRetry = () => {
    retryLastMessage()
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <Card className="rounded-none border-b shadow-sm">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-full flex-shrink-0">
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg truncate">Solar Solutions Assistant</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Installation • Equipment Rental • DFP Program
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Meter: {user?.meterId}</p>
                {user?.name && <p className="text-xs text-gray-600">{user.name}</p>}
              </div>
              <div className="hidden sm:block">
                <ConnectionStatusIndicator status={connectionStatus} isLoading={isLoading} />
              </div>
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearChat} className="hidden sm:flex">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>

          {/* Mobile-only user info and connection status */}
          <div className="sm:hidden mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-600">Meter: {user?.meterId}</span>
            <div className="flex items-center gap-2">
              <ConnectionStatusIndicator status={connectionStatus} isLoading={isLoading} />
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearChat}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="p-3 sm:p-4 bg-white rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 shadow-sm">
                  <Sun className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Welcome to Solar Solutions!</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                  I can help you with solar installations, equipment rentals, and DFP program subscriptions.
                </p>

                {/* Simplified Quick Start Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg mx-auto mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("I'm interested in solar panel installation")}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Solar Installation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("I need to rent solar equipment")}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Equipment Rental
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("Tell me about the DFP program")}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    DFP Program
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Ask me about installation costs, rental options, or DFP program benefits!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-2 border">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {connectionStatus.status === "error" && (
              <div className="flex justify-center mb-4">
                <Button variant="outline" size="sm" onClick={handleRetry} className="text-red-600 border-red-200">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Last Message
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Form */}
      <Card className="rounded-none border-t shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Sending message..." : "Ask about installation, rental, or DFP program..."}
              disabled={isLoading}
              className="flex-1 h-10 sm:h-auto text-base"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
