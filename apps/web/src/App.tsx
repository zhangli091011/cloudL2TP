import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Nodes from './pages/Nodes'
import Policies from './pages/Policies'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useStore(s => s.isLoggedIn)
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useStore(s => s.sidebarCollapsed)
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  const isLoggedIn = useStore(s => s.isLoggedIn)
  const theme = useStore(s => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/nodes" element={<Nodes />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
