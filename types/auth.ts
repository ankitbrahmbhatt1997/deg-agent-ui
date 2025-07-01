export interface AuthCredentials {
  meterId: string
  password: string
}

export interface AuthResponse {
  status: string
  message: string
  data?: {
    user: {
      id: string
      meter_id: string
      email: string
      full_name: string
      is_active: boolean
      created_at: string
      address?: string
      account_type?: string
    }
    access_token: string
    token_type: string
  }
  error?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: {
    meterId: string
    name?: string
    address?: string
    accountType?: string
    email?: string
    id?: string
  } | null
  token: string | null
  loading: boolean
  error: string | null
}
