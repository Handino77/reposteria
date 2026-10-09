import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CLP } from '../utils/conversores'
import { Crown, CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, RefreshCw, Clock } from 'lucide-react'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'

export default function Suscripcion({ user }) {
  const [repostera, setRepostera] = useState(null)
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const confirmacionIniciada = useRef(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  useEffect(() => {
    fetchSuscripcionData()
    handleReturnFromFlow()
  }, [user])

  const handleReturnFromFlow = async () => {
    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get('token')
    const vieneDeFlow = tokenUrl || params.get('tab') === 'suscripcion'

    if (vieneDeFlow) {
      if (confirmacionIniciada.current) return
      confirmacionIniciada.current = true
      try {
        setProcessing(true)
        showToast('Confirmando registro de tarjeta con Flow...')

        // Si la URL trae token, usarlo directamente.
        // Si no, mandar userId para que el webhook recupere el token guardado en la DB.
        const invokeBody = tokenUrl
          ? { token: tokenUrl }
          : { userId: user.id }

        const { data, error } = await supabase.functions.invoke('flow-webhook-suscripcion', {
          body: invokeBody
        })

        if (!error && data?.status === 'ok') {
          showToast('🎉 ¡Suscripción activada con éxito!')
        } else {
          let detalle = error?.message || data?.error || 'No se pudo confirmar el registro'
          if (error?.context) {
            try {
              const body = await error.context.json()
              if (body?.error) detalle = body.error
            } catch (_e) {}
          }
          console.error('Fallo al confirmar registro con Flow:', detalle)
          showToast('No pudimos confirmar tu tarjeta: ' + detalle)
        }

        // Limpiar token guardado en sessionStorage (respaldo) y parámetros de URL
        sessionStorage.removeItem('flow_register_token')
        window.history.replaceState({}, document.title, window.location.pathname)
        await fetchSuscripcionData()
      } catch (err) {
        console.error('Error al procesar retorno de Flow:', err)
        showToast('Error inesperado al confirmar tarjeta: ' + err.message)
      } finally {
        setProcessing(false)
      }
    }
  }

  const fetchSuscripcionData = async () => {
    try {
      setLoading(true)
      // 1. Obtener datos de repostera
      const { data: repData, error: repError } = await supabase
        .from('reposteras')
        .select('*')
        .eq('id', user.id)
        .single()

      if (repError) throw repError
      setRepostera(repData)

      // 2. Obtener historial de pagos
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos_suscripcion')
        .select('*')
        .order('creado_en', { ascending: false })

      if (!pagosError) {
        setPagos(pagosData || [])
      }
    } catch (err) {
      console.error('Error al cargar datos de suscripción:', err)
      showToast('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleIniciarSuscripcion = async () => {
    try {
      setProcessing(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        showToast('Sesión no válida. Inicia sesión nuevamente.')
        return
      }

      // Invocar Edge Function
      const { data, error } = await supabase.functions.invoke('flow-iniciar-suscripcion', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          urlReturn: `https://jhkezswzxhfxwjxmgrta.supabase.co/functions/v1/flow-return-redirect?returnTo=${encodeURIComponent(window.location.origin)}`
        }
      })

      if (error || !data?.redirectUrl) {
        let errDetail = error?.message || data?.error || 'No se recibió URL de redirección de Flow'
        if (error && error.context) {
          try {
            const body = await error.context.json()
            if (body?.error) errDetail = body.error
          } catch (_e) {}
        }
        throw new Error(errDetail)
      }

      // Guardar el token antes de redirigir: Flow no garantiza reenviarlo al volver
      if (data.token) {
        sessionStorage.setItem('flow_register_token', data.token)
      }
      showToast('Redirigiendo a Flow.cl para registrar tu tarjeta...')
      window.location.href = data.redirectUrl
    } catch (err) {
      console.error('Error al iniciar suscripción:', err)
      showToast('Error al conectar con Flow: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelarSuscripcion = async () => {
    if (!confirm('¿Segura que deseas cancelar tu suscripción a Kit de la Repostera PRO?')) return

    try {
      setProcessing(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const { data, error } = await supabase.functions.invoke('flow-cancelar-suscripcion', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (error || data?.error) {
        throw new Error(error?.message || data?.error)
      }

      showToast('Tu suscripción ha sido cancelada')
      fetchSuscripcionData()
    } catch (err) {
      console.error('Error al cancelar suscripción:', err)
      showToast('Error al cancelar suscripción')
    } finally {
      setProcessing(false)
    }
  }

  const handleEliminarCuenta = async () => {
    const confirmacion = prompt(
      '⚠️ ADVERTENCIA: Esta acción eliminará permanentemente tu cuenta, tus recetas, tu despensa y todos tus pedidos de forma irreversible.\n\nEscribe "ELIMINAR" para confirmar:'
    )

    if (confirmacion !== 'ELIMINAR') {
      showToast('Cancelado. No se realizaron cambios.')
      return
    }

    try {
      setProcessing(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (repostera?.estado_suscripcion === 'activa') {
        await supabase.functions.invoke('flow-cancelar-suscripcion', {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      const { error } = await supabase.from('reposteras').delete().eq('id', user.id)
      if (error) throw error

      await supabase.auth.signOut()
      showToast('Tu cuenta y todos tus datos han sido eliminados permanentemente.')
    } catch (err) {
      console.error('Error al eliminar cuenta:', err)
      showToast('Error al eliminar la cuenta: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const estado = repostera?.estado_suscripcion || 'pendiente'

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Mi Suscripción PRO"
        introduccion={`Gestiona tu plan mensual de ${CLP(3000, 0)} CLP/mes para acceder a todas las funciones avanzadas.`}
      />

      {loading ? (
        <Panel>
          <div className="p-8 text-center text-[var(--tinta-suave)] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--vino)]" />
            <span>Cargando estado de tu suscripción...</span>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Estado Suscripción */}
          <div className="md:col-span-2 space-y-6">
            <Panel>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--linea-suave)] pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--tinta-suave)]">Plan Actual</span>
                  <h3 className="text-xl font-bold text-[var(--tinta)]">Kit Repostera PRO ({CLP(3000, 0)} CLP / mes)</h3>
                </div>

                {/* Badge Estado */}
                <div>
                  {estado === 'activa' && (
                    <Pastilla tono="exito" icono={CheckCircle2}>
                      Suscripción Activa
                    </Pastilla>
                  )}
                  {estado === 'pendiente' && (
                    <Pastilla tono="alerta" icono={Clock}>
                      Pendiente de Pago
                    </Pastilla>
                  )}
                  {estado === 'vencida' && (
                    <Pastilla tono="error" icono={AlertTriangle}>
                      Cobro Vencido
                    </Pastilla>
                  )}
                  {estado === 'cancelada' && (
                    <Pastilla tono="neutro">
                      Suscripción Cancelada
                    </Pastilla>
                  )}
                </div>
              </div>

              {/* Detalles según Estado */}
              {estado === 'activa' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-sm space-y-1">
                    <p>✅ <strong className="text-emerald-950">¡Tu plan está activo!</strong> Tienes acceso total a todas las funciones y trivias.</p>
                    <p>
                      <strong className="text-emerald-950">Próximo cobro automático:</strong>{' '}
                      {repostera?.fecha_proximo_cobro ? repostera.fecha_proximo_cobro.split('-').reverse().join('/') : 'En un mes'}
                    </p>
                  </div>

                  <Boton
                    variante="peligro"
                    tamano="sm"
                    onClick={handleCancelarSuscripcion}
                    disabled={processing}
                  >
                    {processing ? 'Procesando...' : 'Cancelar Suscripción'}
                  </Boton>
                </div>
              ) : estado === 'vencida' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm space-y-1">
                    <p>⚠️ <strong>El último cobro mensual no pudo ser procesado.</strong></p>
                    <p>Por favor vuelve a registrar tu tarjeta para re-activar tu suscripción PRO.</p>
                  </div>

                  <Boton
                    variante="principal"
                    onClick={handleIniciarSuscripcion}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    <span>Actualizar Tarjeta ({CLP(3000, 0)} CLP/mes)</span>
                  </Boton>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-[var(--tinta-suave)] space-y-2">
                    <p>Con tu suscripción mensual obtienes:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-[var(--tinta)]">
                      <li>Acceso ilimitado a Despensa, Recetas y Precio Justo</li>
                      <li>Calendario de Pedidos sin límites</li>
                      <li>Cobro automático seguro mensual gestionado por Flow.cl</li>
                      <li>Acceso completo a trivias y comunidad de reposteras</li>
                    </ul>
                  </div>

                  <Boton
                    variante="principal"
                    onClick={handleIniciarSuscripcion}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    <span>Suscribirme con Tarjeta ({CLP(3000, 0)} CLP/mes)</span>
                  </Boton>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-[var(--tinta-suave)] pt-4 mt-4 border-t border-[var(--linea-suave)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pagos 100% encriptados y procesados directamente por Flow.cl (Transbank / Tarjetas Webpay)</span>
              </div>
            </Panel>

            {/* Zona de Peligro: Eliminación de Cuenta (Cumplimiento Ley 19.628 / 21.719 Chile) */}
            <Panel>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
                <div>
                  <h4 className="text-sm font-bold text-red-950">Privacidad y Gestión de Datos (Ley N° 19.628 / 21.719)</h4>
                  <p className="text-xs text-[var(--tinta-suave)] mt-1">
                    Puedes solicitar la eliminación permanente de tu cuenta y purgar todos tus datos (recetas, pedidos e ingredientes).
                  </p>
                </div>
                <Boton variante="peligro" tamano="sm" onClick={handleEliminarCuenta} disabled={processing}>
                  Eliminar Mi Cuenta y Datos
                </Boton>
              </div>
            </Panel>
          </div>

          {/* Historial de Pagos */}
          <div>
            <Panel
              titulo={
                <div className="flex items-center justify-between w-full">
                  <span>Historial de Cobros</span>
                  <button onClick={fetchSuscripcionData} className="text-[var(--tinta-suave)] hover:text-[var(--tinta)] cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            >
              {pagos.length === 0 ? (
                <p className="text-xs text-[var(--tinta-suave)] py-4 text-center">Aún no hay cobros registrados</p>
              ) : (
                <div className="divide-y divide-[var(--linea-suave)] text-xs space-y-2">
                  {pagos.map((p) => (
                    <div key={p.id} className="pt-2 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-[var(--tinta)]">{CLP(p.monto || 3000, 0)}</p>
                        <p className="text-[10px] text-[var(--tinta-suave)]">
                          {new Date(p.creado_en || p.fecha).toLocaleDateString()}
                        </p>
                      </div>
                      <Pastilla
                        tono={p.estado === 'pagado' ? 'exito' : 'error'}
                        tamano="sm"
                      >
                        {p.estado || 'pagado'}
                      </Pastilla>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
