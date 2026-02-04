import { useAuth } from "./auth/AuthContext"
import Chat from "./pages/Chat"
import Authentication from "./pages/guest/Authentication"

function App() {

  const {user, loading} = useAuth()
  

  if (loading) return <div>Loading...</div>

  return user ? <Chat user={user}/> : <Authentication/>
}

export default App
