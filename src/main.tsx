// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ApolloProvider } from '@apollo/client/react'
import { client } from './apollo/client.ts'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <App />
  // </StrictMode>,
  <ApolloProvider client={client}>
    <AuthProvider>
      <App/>
    </AuthProvider>
  </ApolloProvider>
)
