import React from 'react'
import { Crown, LogIn, Sparkles, X, CheckCircle2 } from 'lucide-react'
import { Boton } from './ui/Boton'

/**
 * ModalUpsell
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {'login' | 'limit_despensa' | 'limit_recetas' | 'pedidos_pro'} modo
 * @param {() => void} onIrALogin
 * @param {() => void} onIrASuscripcion
 */
export function ModalUpsell({
  isOpen,
  onClose,
  modo = 'login',
  onIrALogin,
  onIrASuscripcion
}) {
  if (!isOpen) return null

  const esLogin = modo === 'login'
  const esPedido = modo === 'pedidos_pro'
  const esDespensa = modo === 'limit_despensa'
  const esRecetas = modo === 'limit_recetas'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[24px] p-6 max-w-md w-full shadow-[var(--sombra-panel)] relative space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--tinta-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)] transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Visual */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-full bg-[var(--rosa-aviso)] border border-[var(--rosa-aviso-borde)] flex items-center justify-center text-[var(--vino)] shadow-xs">
            {esLogin ? (
              <LogIn className="w-7 h-7 stroke-[1.8]" />
            ) : (
              <Crown className="w-7 h-7 stroke-[1.8] text-[var(--oro)]" />
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10.5px] uppercase tracking-[0.12em] font-extrabold text-[var(--vino)] flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--oro)]" />
              {esLogin ? 'Inicia sesión para guardar' : 'Tu negocio está creciendo 💖'}
            </span>
            <h3 className="font-serif-title text-xl font-bold text-[var(--tinta)]">
              {esLogin && '¡Hola, repostera linda!'}
              {esDespensa && 'Límite de insumos alcanzado'}
              {esRecetas && 'Límite de recetas alcanzado'}
              {esPedido && 'Gestión de Pedidos PRO'}
            </h3>
          </div>
        </div>

        {/* Mensaje Personalizado de Eli */}
        <div className="bg-[var(--rosa-aviso)] border border-[var(--rosa-aviso-borde)] p-4 rounded-[16px] text-xs leading-relaxed text-[var(--tinta-media)] space-y-2">
          {esLogin && (
            <p>
              Puedes navegar y probar todas las calculadoras libremente. Para guardar tus propios ingredientes y recetas de forma segura, inicia sesión o crea tu cuenta gratuita.
            </p>
          )}

          {esDespensa && (
            <p>
              Has alcanzado el límite de <b>5 ingredientes</b> de la versión gratuita. Para guardar ingredientes ilimitados y tener tus costos siempre al día, suscríbete al Plan PRO.
            </p>
          )}

          {esRecetas && (
            <p>
              Has alcanzado el límite de <b>3 recetas</b> de la versión gratuita. Para guardar todas tus recetas familiares e insumos sin restricciones, suscríbete al Plan PRO.
            </p>
          )}

          {esPedido && (
            <p>
              El calendario de pedidos y la generación automática de listas de compras para WhatsApp son funciones exclusivas del <b>Plan PRO ($3.000 CLP/mes)</b>.
            </p>
          )}
        </div>

        {/* Lista de beneficios PRO (si es upsell) */}
        {!esLogin && (
          <div className="space-y-2 px-1 text-xs text-[var(--tinta-media)] font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--good)] shrink-0" />
              <span>Ingredientes y Recetas ilimitadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--good)] shrink-0" />
              <span>Calendario de pedidos y recordatorios</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--good)] shrink-0" />
              <span>Lista de compras automática para WhatsApp</span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2 pt-2">
          {esLogin ? (
            <Boton
              variante="primario"
              anchoCompleto
              onClick={() => {
                onClose()
                onIrALogin()
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión / Registrarme Gratis
            </Boton>
          ) : (
            <>
              <Boton
                variante="oro"
                anchoCompleto
                onClick={() => {
                  onClose()
                  onIrASuscripcion()
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Obtener Plan PRO ($3.000 CLP/mes)
              </Boton>
              {onIrALogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onIrALogin()
                  }}
                  className="text-xs text-[var(--tinta-suave)] hover:text-[var(--vino)] text-center py-1 transition-colors cursor-pointer"
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              )}
            </>
          )}

          <Boton variante="subtil" anchoCompleto onClick={onClose}>
            Seguir explorando
          </Boton>
        </div>
      </div>
    </div>
  )
}
