import { AuthProvider } from "../contexts/auth-context"
import ProtectedRoute from "../components/protected-route"
import SolarChatAgent from "../solar-chat-agent"

export default function Page() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SolarChatAgent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
