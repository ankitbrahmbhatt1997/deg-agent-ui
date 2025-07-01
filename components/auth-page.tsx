"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Sun, Zap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "../contexts/auth-context"

export default function AuthPage() {
  const [meterId, setMeterId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { login, loading, error, clearError, isAuthenticated } = useAuth()

  console.log("🏠 AuthPage rendered:", { loading, error, isAuthenticated })

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [meterId, password, clearError])

  // Redirect if already authenticated (shouldn't happen with ProtectedRoute, but safety check)
  useEffect(() => {
    if (isAuthenticated) {
      console.log("✅ User is authenticated in AuthPage - this shouldn't happen!")
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📝 Form submitted")

    if (!meterId.trim() || !password.trim()) {
      console.log("❌ Form validation failed - empty fields")
      return
    }

    console.log("🚀 Starting login with:", { meterId: meterId.trim(), password: "***" })

    const success = await login({ meterId: meterId.trim(), password })

    console.log("🎯 Login result:", success)

    if (success) {
      // Save meter ID if remember me is checked
      if (rememberMe) {
        console.log("💾 Saving meter ID for remember me")
        localStorage.setItem("solar_remember_meter", meterId)
      }
      console.log("✅ Login successful - redirect should happen automatically")
      // The redirect will be handled automatically by ProtectedRoute
      // when isAuthenticated becomes true
    } else {
      console.log("❌ Login failed")
    }
  }

  // Load remembered meter ID
  useEffect(() => {
    const rememberedMeter = localStorage.getItem("solar_remember_meter")
    if (rememberedMeter) {
      console.log("💾 Loading remembered meter ID:", rememberedMeter)
      setMeterId(rememberedMeter)
      setRememberMe(true)
    }
  }, [])

  const formatMeterId = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

    // Format as XXXX-XXXX-XXXX if it's numeric, or keep as-is for alphanumeric
    if (/^\d+$/.test(cleaned) && cleaned.length <= 12) {
      return cleaned.replace(/(\d{4})(?=\d)/g, "$1-")
    }

    return cleaned
  }

  const handleMeterIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMeterId(e.target.value)
    setMeterId(formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <strong>Debug:</strong> Loading: {loading.toString()}, Error: {error || "none"}, Auth:{" "}
          {isAuthenticated.toString()}
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-3 sm:mb-4 shadow-lg">
            <Sun className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Solar Solutions</h1>
          <p className="text-sm sm:text-base text-gray-600">Access your solar account dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Enter your meter ID and password to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Meter ID Field */}
              <div className="space-y-2">
                <Label htmlFor="meterId" className="text-sm font-medium">
                  Meter ID
                </Label>
                <div className="relative">
                  <Zap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="meterId"
                    type="text"
                    placeholder="Enter your meter ID"
                    value={meterId}
                    onChange={handleMeterIdChange}
                    className="pl-10 h-11 sm:h-12 text-base"
                    maxLength={14}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Find your meter ID on your solar panel system or monthly statement
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-11 sm:h-12 text-base"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember my meter ID
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium text-base"
                disabled={loading || !meterId.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Test Button - Remove in production */}
            <div className="mt-4">
              <Button
                onClick={() => {
                  console.log("🧪 Test button clicked")
                  console.log("Current state:", { meterId, password, loading, error })
                }}
                variant="outline"
                className="w-full"
              >
                Debug: Log Current State
              </Button>
            </div>

            {/* Help Links */}
            <div className="mt-6 text-center space-y-2">
              <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot your password?
              </Button>
              <div className="text-xs text-gray-500">
                Need help? Contact support at{" "}
                <a href="tel:1-800-SOLAR-01" className="text-blue-600 hover:underline">
                  1-800-SOLAR-01
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
            <Sun className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Solar Installation</p>
            <p className="text-xs text-gray-600">Professional setup</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border">
            <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Equipment Rental</p>
            <p className="text-xs text-gray-600">Flexible solutions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
