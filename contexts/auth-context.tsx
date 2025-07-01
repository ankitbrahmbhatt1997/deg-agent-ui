"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { AuthState, AuthCredentials } from "../types/auth"

interface AuthContextType extends AuthState {
  login: (credentials: AuthCredentials) => Promise<boolean>
  logout: () => void
  clearError: () => void
  checkAuthStatus: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API Configuration
const API_BASE_URL = "https://api-deg-agents.becknprotocol.io"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true, // Start with loading true to check existing auth
    error: null,
  })

  // Function to validate JWT token (basic check)
  const isTokenValid = (token: string): boolean => {
    console.log("🔍 Validating token:", token.substring(0, 20) + "...")
    try {
      // Basic JWT structure check
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.log("❌ Invalid JWT structure")
        return false
      }

      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]))
      console.log("📄 JWT payload:", payload)

      const currentTime = Math.floor(Date.now() / 1000)
      console.log("⏰ Current time:", currentTime, "Token exp:", payload.exp)

      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log("⏰ Token is expired")
        return false
      }

      console.log("✅ Token is valid")
      return true
    } catch (error) {
      console.log("❌ Token validation error:", error)
      return false
    }
  }

  // Check authentication status
  const checkAuthStatus = () => {
    console.log("🔄 Checking auth status...")
    const token = localStorage.getItem("solar_auth_token")
    const user = localStorage.getItem("solar_auth_user")

    console.log("💾 Stored token:", token ? "EXISTS" : "NOT_FOUND")
    console.log("💾 Stored user:", user ? "EXISTS" : "NOT_FOUND")

    if (token && user) {
      try {
        // Validate token
        if (isTokenValid(token)) {
          const userData = JSON.parse(user)
          console.log("✅ Auth status: AUTHENTICATED", userData)
          setAuthState({
            isAuthenticated: true,
            user: userData,
            token,
            loading: false,
            error: null,
          })
        } else {
          // Token is invalid/expired, clear storage
          console.log("🗑️ Clearing invalid token")
          localStorage.removeItem("solar_auth_token")
          localStorage.removeItem("solar_auth_user")
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        console.log("❌ Error parsing stored data:", error)
        // Clear invalid stored data
        localStorage.removeItem("solar_auth_token")
        localStorage.removeItem("solar_auth_user")
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null,
        })
      }
    } else {
      console.log("❌ Auth status: NOT_AUTHENTICATED")
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      })
    }
  }

  // Check for existing auth on mount
  useEffect(() => {
    console.log("🚀 AuthProvider mounted, checking auth status...")
    checkAuthStatus()
  }, [])

  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    console.log("🔐 Starting login process...")
    console.log("📝 Credentials:", { meterId: credentials.meterId, password: "***" })

    setAuthState((prev) => ({ ...prev, loading: true, error: null }))

    const requestPayload = {
      meter_id: credentials.meterId,
      password: credentials.password,
    }

    console.log("📤 Request payload:", { ...requestPayload, password: "***" })
    console.log("🌐 API URL:", `${API_BASE_URL}/api/auth/login`)

    try {
      console.log("📡 Making API request...")

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      const data = await response.json()
      console.log("📄 RESPONSE DATA:", data)

      // Check for success based on the actual API format
      const isSuccess = response.ok && data.status === "success" && data.data?.access_token

      console.log("🔍 Success check:", {
        responseOk: response.ok,
        status: data.status,
        hasAccessToken: !!data.data?.access_token,
        finalIsSuccess: isSuccess,
      })

      if (isSuccess) {
        console.log("✅ Login successful!")

        // Extract user data from API response
        const apiUser = data.data.user
        const userData = {
          meterId: apiUser.meter_id,
          name: apiUser.full_name || apiUser.email || `User ${apiUser.meter_id.slice(-4)}`,
          address: apiUser.address || "",
          accountType: apiUser.account_type || "residential",
          email: apiUser.email,
          id: apiUser.id,
        }

        const token = data.data.access_token

        console.log("👤 User data:", userData)
        console.log("🎫 Token received:", token ? "YES" : "NO")

        if (!token) {
          console.log("❌ No token in response")
          throw new Error("No token received from server")
        }

        // Store auth data
        console.log("💾 Storing auth data...")
        localStorage.setItem("solar_auth_token", token)
        localStorage.setItem("solar_auth_user", JSON.stringify(userData))

        setAuthState({
          isAuthenticated: true,
          user: userData,
          token,
          loading: false,
          error: null,
        })

        console.log("🎉 Login process completed successfully!")
        return true
      } else {
        console.log("❌ Login failed:", data)

        // Handle API error response
        let errorMessage = "Invalid meter ID or password"

        if (data.message && data.status !== "success") {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        }

        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
        return false
      }
    } catch (error) {
      console.error("💥 Login error:", error)

      let errorMessage = "Network error. Please check your connection and try again."

      if (error instanceof Error) {
        console.log("🔍 Error details:", error.message)
        if (error.message.includes("fetch")) {
          errorMessage = "Unable to connect to server. Please try again later."
        } else if (error.message.includes("token")) {
          errorMessage = "Authentication failed. Please try again."
        } else if (error.message.includes("JSON")) {
          errorMessage = "Server returned invalid response. Please try again."
        }
      }

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  const logout = () => {
    console.log("🚪 Logging out...")
    localStorage.removeItem("solar_auth_token")
    localStorage.removeItem("solar_auth_user")
    localStorage.removeItem("solar_remember_meter")

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    })
    console.log("✅ Logout completed")
  }

  const clearError = () => {
    console.log("🧹 Clearing error")
    setAuthState((prev) => ({ ...prev, error: null }))
  }

  // Debug auth state changes
  useEffect(() => {
    console.log("🔄 Auth state changed:", {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasToken: !!authState.token,
      loading: authState.loading,
      error: authState.error,
    })
  }, [authState])

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        clearError,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
