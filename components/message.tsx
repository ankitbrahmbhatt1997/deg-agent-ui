"use client"

import type { Message } from "../types/chat"
import { Star, DollarSign, Building2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface MessageProps {
  message: Message
}

interface Product {
  name: string
  price: string
  rating: number
  provider: string
  index: number
}

function parseProducts(content: string): Product[] {
  const products: Product[] = []

  // Match numbered product entries
  const productRegex =
    /(\d+)\.\s*\*\*(.*?)\*\*\s*\n\s*-\s*Price:\s*(.*?)\n\s*-\s*Rating:\s*⭐\s*([\d.]+)\s*\n\s*-\s*Provider:\s*(.*?)(?=\n|$)/g

  let match
  while ((match = productRegex.exec(content)) !== null) {
    products.push({
      index: Number.parseInt(match[1]),
      name: match[2].trim(),
      price: match[3].trim(),
      rating: Number.parseFloat(match[4]),
      provider: match[5].trim(),
    })
  }

  return products
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="mb-3 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2">{product.name}</h4>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            #{product.index}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{product.price}</span>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{product.rating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${star <= product.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">{product.provider}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  )
}

function formatContent(content: string) {
  // Parse products first
  const products = parseProducts(content)

  if (products.length > 0) {
    // Extract the intro text (everything before the first numbered item)
    const introMatch = content.match(/^(.*?)(?=\d+\.\s*\*\*)/s)
    const introText = introMatch ? introMatch[1].trim() : ""

    return { type: "products", introText, products }
  }

  // Check for other structured content patterns
  if (content.includes("**") || content.includes("*")) {
    return { type: "formatted", content }
  }

  return { type: "plain", content }
}

function FormattedContent({ content }: { content: string }) {
  const formatted = formatContent(content)

  if (formatted.type === "products") {
    return (
      <div>
        {formatted.introText && <p className="text-sm text-gray-700 mb-4">{formatted.introText}</p>}
        <div className="space-y-2">
          {formatted.products.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </div>
    )
  }

  if (formatted.type === "formatted") {
    // Handle basic markdown-like formatting
    const formattedText = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")

    return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedText }} />
  }

  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
}

export function ChatMessage({ message }: MessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 sm:mb-4 px-2 sm:px-0`}>
      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-lg px-3 sm:px-4 py-3 ${
            isUser ? "bg-blue-600 text-white" : "bg-white text-gray-900 border shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <FormattedContent content={message.content} />
          )}
        </div>

        <div className={`flex items-center justify-between mt-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`text-xs text-gray-500 ${isUser ? "text-right" : "text-left"}`}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: window.innerWidth < 640,
            })}
          </div>

          {!isUser && <CopyButton content={message.content} />}
        </div>
      </div>
    </div>
  )
}
