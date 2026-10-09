import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
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
      <div className="min-h-screen bg-[var(--fondo)] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--vino)]" />
        <p className="mt-2 text-sm font-medium text-[var(--tinta-suave)]">
          Cargando Kit de la Repostera...
        </p>
      </div>
    )
  }

  return <Dashboard user={session?.user || null} />
}
