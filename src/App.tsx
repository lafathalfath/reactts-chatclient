import { useAuth } from "./auth/AuthContext"
import Chat from "./pages/Chat"
import Login from "./pages/Login"

function App() {

  const {user, loading} = useAuth()
  

  if (loading) return <div>Loading...</div>

  return user ? <Chat user={user}/> : <Login/>
}

export default App
