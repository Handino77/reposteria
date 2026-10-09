import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/ui/Layout'
import Despensa from './Despensa'
import Recetas from './Recetas'
import PrecioJusto from './PrecioJusto'
import Pedidos from './Pedidos'
import Suscripcion from './Suscripcion'
import Escalador from './Escalador'
import Conversor from './Conversor'
import Login from './Login'
import TerminosYPrivacidad from './TerminosYPrivacidad'

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'suscripcion' || params.has('token')) {
      return 'suscripcion'
    }
    return 'despensa'
  })
  const [recetaACostear, setRecetaACostear] = useState(null)
  const [estadoSuscripcion, setEstadoSuscripcion] = useState('pendiente')

  useEffect(() => {
    if (!user) {
      setEstadoSuscripcion('pendiente')
      return
    }

    let isMounted = true
    async function fetchEstado() {
      try {
        const { data } = await supabase
          .from('reposteras')
          .select('estado_suscripcion')
          .eq('id', user.id)
          .maybeSingle()

        if (isMounted && data) {
          setEstadoSuscripcion(data.estado_suscripcion || 'pendiente')
        }
      } catch (err) {
        console.error('Error al obtener estado suscripción:', err)
      }
    }

    fetchEstado()
    return () => {
      isMounted = false
    }
  }, [user])

  const isPro = estadoSuscripcion === 'activa'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setActiveTab('despensa')
  }

  const handleCostearRecetaDirecta = (receta) => {
    setRecetaACostear(receta)
    setActiveTab('costos')
  }

  // Si selecciona la pestaña de Login pero ya está autenticado, volver a despensa
  if (activeTab === 'login' && user) {
    setActiveTab('despensa')
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      isPro={isPro}
      onSignOut={handleSignOut}
    >
      <div className="transition-all">
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto pt-4">
            <Login />
          </div>
        )}
        {activeTab === 'despensa' && (
          <Despensa
            user={user}
            isPro={isPro}
            onIrALogin={() => setActiveTab('login')}
            onIrASuscripcion={() => setActiveTab('suscripcion')}
          />
        )}
        {activeTab === 'recetas' && (
          <Recetas
            user={user}
            isPro={isPro}
            onCostearReceta={handleCostearRecetaDirecta}
            onIrALogin={() => setActiveTab('login')}
            onIrASuscripcion={() => setActiveTab('suscripcion')}
          />
        )}
        {activeTab === 'costos' && (
          <PrecioJusto recetaPrecargada={recetaACostear} />
        )}
        {activeTab === 'escalador' && <Escalador user={user} />}
        {activeTab === 'conversor' && <Conversor />}
        {activeTab === 'pedidos' && (
          <Pedidos
            user={user}
            isPro={isPro}
            onIrALogin={() => setActiveTab('login')}
            onIrASuscripcion={() => setActiveTab('suscripcion')}
          />
        )}
        {activeTab === 'suscripcion' && (
          <Suscripcion
            user={user}
            onIrALogin={() => setActiveTab('login')}
          />
        )}
        {activeTab === 'privacidad' && (
          <TerminosYPrivacidad volver={() => setActiveTab('suscripcion')} />
        )}
      </div>
    </Layout>
  )
}
