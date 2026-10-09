import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/ui/Layout'
import Despensa from './Despensa'
import Recetas from './Recetas'
import PrecioJusto from './PrecioJusto'
import Pedidos from './Pedidos'
import Suscripcion from './Suscripcion'
import Escalador from './Escalador'
import Conversor from './Conversor'

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleCostearRecetaDirecta = (receta) => {
    setRecetaACostear(receta)
    setActiveTab('costos')
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onSignOut={handleSignOut}
    >
      <div className="transition-all">
        {activeTab === 'despensa' && <Despensa user={user} />}
        {activeTab === 'recetas' && (
          <Recetas user={user} onCostearReceta={handleCostearRecetaDirecta} />
        )}
        {activeTab === 'costos' && (
          <PrecioJusto recetaPrecargada={recetaACostear} />
        )}
        {activeTab === 'escalador' && <Escalador user={user} />}
        {activeTab === 'conversor' && <Conversor />}
        {activeTab === 'pedidos' && <Pedidos user={user} />}
        {activeTab === 'suscripcion' && <Suscripcion user={user} />}
        {activeTab === 'privacidad' && <TerminosYPrivacidad volver={() => setActiveTab('suscripcion')} />}
      </div>
    </Layout>
  )
}
