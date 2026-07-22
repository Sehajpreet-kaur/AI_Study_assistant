import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider,useAuth } from './client/src/context/AuthContext'
import Login from './client/src/pages/Login'
import Register from './client/src/pages/Register'
import Dashboard from './client/src/pages/Dashboard'
import Chat from './client/src/pages/Chat'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/chat"      element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}