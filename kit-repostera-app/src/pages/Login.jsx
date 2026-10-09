import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LogIn, UserPlus, Cake, AlertCircle } from 'lucide-react'
import { Campo, Input } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err) {
      setErrorMsg(err.message || 'Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setInfoMsg('')

    try {
      if (isRegistering) {
        // Registro de nueva repostera
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre_negocio: nombreNegocio || 'Mi negocio'
            }
          }
        })
        if (error) throw error

        if (data?.user?.identities?.length === 0) {
          setErrorMsg('Este correo ya se encuentra registrado. Intenta iniciar sesión.')
        } else {
          setInfoMsg('¡Registro exitoso! Revisa tu correo o inicia sesión si la confirmación no está requerida.')
        }
      } else {
        // Inicio de sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--fondo)] flex flex-col justify-center items-center p-4">
      {/* Container Principal */}
      <div className="w-full max-w-md bg-[var(--superficie)] rounded-[20px] shadow-[var(--sombra-panel)] p-8 border border-[var(--linea)]">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-[var(--vino)] text-white shadow-[var(--sombra-boton)] mb-3">
            <Cake className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h1 className="font-serif-title text-3xl font-semibold text-[var(--tinta)]">
            Kit de la Repostera
          </h1>
          <p className="text-xs text-[var(--tinta-suave)] mt-1.5 font-medium">
            {isRegistering ? 'Crea tu cuenta para comenzar' : 'Bienvenida de nuevo'}
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-5 p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
            {infoMsg}
          </div>
        )}

        {/* Botón Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-[44px] flex items-center justify-center gap-3 bg-white hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-[var(--tinta-media)] font-bold text-[12.5px] rounded-[11px] transition-all mb-6 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--linea-suave)]"></div>
          </div>
          <span className="relative bg-[var(--superficie)] px-3 text-[10.5px] font-bold text-[var(--tinta-tenue)] uppercase tracking-[0.1em]">
            o con tu correo
          </span>
        </div>

        {/* Formulario Email */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <Campo id="login-negocio" label="Nombre de tu Negocio">
              <Input
                id="login-negocio"
                type="text"
                placeholder="Ej: Dulce Antojo"
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
              />
            </Campo>
          )}

          <Campo id="login-email" label="Correo Electrónico">
            <Input
              id="login-email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Campo>

          <Campo id="login-pass" label="Contraseña">
            <Input
              id="login-pass"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Campo>

          <Boton
            variante="principal"
            type="submit"
            disabled={loading}
            className="w-full h-[44px] mt-2"
          >
            {isRegistering ? (
              <>
                <UserPlus className="w-4 h-4 stroke-[2]" />
                <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2]" />
                <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              </>
            )}
          </Boton>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center text-xs text-[var(--tinta-suave)]">
          {isRegistering ? (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false)
                  setErrorMsg('')
                  setInfoMsg('')
                }}
                className="text-[var(--vino)] font-bold hover:underline cursor-pointer"
              >
                Inicia Sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true)
                  setErrorMsg('')
                  setInfoMsg('')
                }}
                className="text-[var(--vino)] font-bold hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </p>
          )}
        </div>

        {/* Enlaces Legales y Privacidad (Ley N° 19.628 / 21.719 Chile) */}
        <div className="mt-8 pt-4 border-t border-[var(--linea-suave)] text-center text-[11px] text-[var(--tinta-suave)] space-y-1.5">
          <p>Protegemos tus datos bajo la normativa de Privacidad de Chile.</p>
          <div className="flex justify-center items-center gap-3 font-medium text-[var(--tinta-media)]">
            <a
              href="mailto:contacto@kitrepostera.cl?subject=Consulta%20Privacidad%20Kit%20Repostera"
              className="hover:text-[var(--vino)] underline cursor-pointer"
            >
              Privacidad y Soporte: contacto@kitrepostera.cl
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
