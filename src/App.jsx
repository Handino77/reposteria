import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { Loader2 } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C2185B]" />
        <p className="mt-2 text-sm font-medium text-[#6B5647]">Cargando Kit de la Repostera...</p>
      </div>
    )
  }

  return session ? <Dashboard user={session.user} /> : <Login />
}
