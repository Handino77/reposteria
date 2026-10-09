import React, { useRef, useEffect } from 'react'
import {
  Cake,
  Package,
  BookOpen,
  Calculator,
  Scale,
  RefreshCw,
  Calendar as CalendarIcon,
  Crown,
  LogOut,
  HelpCircle,
  LogIn,
  ChevronRight
} from 'lucide-react'

export function Layout({
  activeTab,
  setActiveTab,
  user,
  isPro = false,
  onSignOut,
  children
}) {
  const activeNavRef = useRef(null)
  const navContainerRef = useRef(null)

  useEffect(() => {
    if (activeNavRef.current) {
      activeNavRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [activeTab])

  const menuItems = [
    { id: 'despensa', label: 'Mi despensa', icon: Package },
    { id: 'recetas', label: 'Mis recetas', icon: BookOpen },
    { id: 'costos', label: 'Precio justo', icon: Calculator },
    { id: 'escalador', label: 'Ajusta tu receta', icon: Scale },
    { id: 'conversor', label: 'Conversor', icon: RefreshCw },
    { id: 'pedidos', label: 'Mis pedidos', icon: CalendarIcon, proBadge: !isPro }
  ]

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'J'
  const userName = user?.user_metadata?.nombre_negocio || user?.email?.split('@')[0] || 'Repostera'

  return (
    <div className="min-h-screen bg-[var(--fondo)] text-[var(--tinta)] font-sans antialiased">
      {/* ========================================== */}
      {/* VISTA DESKTOPS (>= 1024px): GRID 2 COLUMNAS */}
      {/* ========================================== */}
      <div className="hidden lg:grid grid-cols-[250px_minmax(0,1fr)] min-h-screen">
        {/* Menú Lateral */}
        <aside className="bg-[var(--superficie)] border-r border-[var(--linea)] p-5 px-[18px] pb-5 flex flex-col h-screen sticky top-0">
          {/* Marca */}
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-[var(--linea-suave)] mb-4">
            <div className="w-[42px] h-[42px] rounded-[13px] bg-[var(--vino)] text-white flex items-center justify-center shrink-0 shadow-[var(--sombra-boton)]">
              <Cake className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="font-serif-title font-semibold text-[17px] leading-snug text-[var(--tinta)]">
                Kit de la Repostera
              </div>
              <div className="text-[10px] text-[var(--tinta-suave)] mt-0.5 tracking-[0.09em] uppercase font-medium">
                por Cifu Repostera
              </div>
            </div>
          </div>

          {/* Rótulo */}
          <div className="text-[10px] text-[var(--tinta-tenue)] tracking-[0.13em] uppercase font-bold px-3 mb-2">
            Herramientas
          </div>

          {/* Navegación Vertical */}
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13.5px] font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[var(--vino)] text-white font-semibold shadow-[var(--sombra-menu-activo)]'
                      : 'text-[var(--tinta-media)] hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] stroke-[1.8] shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.proBadge && (
                    <span className="ml-auto text-[9.5px] font-extrabold uppercase bg-[var(--oro-fondo)] text-[var(--oro)] px-1.5 py-0.5 rounded-full tracking-wider">
                      PRO
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="flex-grow"></div>

          {/* Bloque inferior: Suscripción y Mentoría */}
          <div className="border-t border-[var(--linea)] pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab('suscripcion')}
              className={`w-full flex items-center gap-2.5 bg-[var(--oro-fondo)] rounded-[12px] p-2.5 px-3 text-[var(--oro)] text-[12.5px] font-bold text-left transition-all cursor-pointer hover:brightness-95 ${
                activeTab === 'suscripcion' ? 'ring-2 ring-[var(--oro)]' : ''
              }`}
            >
              <Crown className="w-4 h-4 stroke-[1.8] shrink-0" />
              <span className="truncate">
                {isPro ? 'Suscripción PRO 👑' : 'Planes & PRO 👑'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
            </button>

            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#DFB2B8] to-[#A75D77] text-white flex items-center justify-center font-serif-title font-semibold text-[15px] shrink-0">
                E
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-[var(--tinta)] truncate">
                  Eli · Cifu Repostera
                </div>
                <div className="text-[11px] text-[var(--tinta-suave)] truncate">
                  Tu mentora repostera 💖
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href="https://www.tiktok.com/@cifu_pasticceria"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok de Cifu Repostera"
                    className="text-[var(--tinta-suave)] hover:text-[var(--vino)] transition-colors p-0.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.82.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-4.52z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/cifu_pasticceria/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram de Cifu Repostera"
                    className="text-[var(--tinta-suave)] hover:text-[var(--vino)] transition-colors p-0.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="p-8 px-10 min-w-0 flex flex-col gap-6">
          {/* Header Superior Derecha (Usuario + Login/Logout) */}
          <div className="flex justify-end items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 border border-[var(--linea)] bg-[var(--superficie)] p-1 pr-3 rounded-full text-xs font-semibold text-[var(--tinta)]">
                  <span className="w-7 h-7 rounded-full bg-[var(--usuaria)] text-white flex items-center justify-center font-serif-title text-xs">
                    {userInitial}
                  </span>
                  <span className="max-w-[120px] truncate">{userName}</span>
                </div>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="Cerrar sesión"
                    className="w-9 h-9 border border-[var(--linea)] bg-[var(--superficie)] rounded-[12px] flex items-center justify-center text-[var(--tinta-suave)] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.8]" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-2 bg-[var(--vino)] text-white text-xs font-semibold px-4 py-2 rounded-full hover:brightness-110 shadow-xs cursor-pointer transition-all"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2]" />
                <span>Iniciar Sesión / Registrarse</span>
              </button>
            )}
          </div>

          {/* Renderizado de la Página Activa */}
          <div className="min-w-0">{children}</div>
        </main>
      </div>

      {/* ========================================== */}
      {/* VISTA CELULAR / TABLET (< 1024px)         */}
      {/* ========================================== */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header Superior Compacto */}
        <header className="sticky top-0 z-30 bg-[var(--superficie)] border-b border-[var(--linea)] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[var(--vino)] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Cake className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <div className="font-serif-title font-semibold text-base leading-none text-[var(--tinta)]">
                Kit de la Repostera
              </div>
              <div className="text-[9.5px] text-[var(--tinta-suave)] tracking-[0.09em] uppercase mt-0.5">
                por Cifu Repostera
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.tiktok.com/@cifu_pasticceria"
              target="_blank"
              rel="noopener noreferrer"
              title="TikTok de Cifu Repostera"
              className="text-[var(--tinta-suave)] hover:text-[var(--vino)] p-1 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.82.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-4.52z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/cifu_pasticceria/"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram de Cifu Repostera"
              className="text-[var(--tinta-suave)] hover:text-[var(--vino)] p-1 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {user ? (
              <>
                <div className="w-8 h-8 rounded-full bg-[var(--usuaria)] text-white flex items-center justify-center font-serif-title text-xs font-semibold ml-1">
                  {userInitial}
                </div>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    aria-label="Cerrar sesión"
                    className="p-1.5 text-[var(--tinta-suave)] hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.8]" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-1 bg-[var(--vino)] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:brightness-110 shadow-xs cursor-pointer ml-1"
              >
                <LogIn className="w-3 h-3" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </header>

        {/* Carril de Navegación Deslizable Horizontal */}
        <div className="sticky top-[57px] z-20 bg-[var(--superficie)] border-b border-[var(--linea)] relative">
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--superficie)] to-transparent z-10"
            aria-hidden="true"
          />

          <nav
            ref={navContainerRef}
            aria-label="Navegación principal"
            className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto flex-nowrap scrollbar-none scroll-smooth"
          >
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  ref={isActive ? activeNavRef : null}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--vino)] text-white font-semibold shadow-sm'
                      : 'text-[var(--tinta-media)] hover:bg-[var(--superficie-2)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <button
              ref={activeTab === 'suscripcion' ? activeNavRef : null}
              type="button"
              onClick={() => setActiveTab('suscripcion')}
              aria-current={activeTab === 'suscripcion' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                activeTab === 'suscripcion'
                  ? 'bg-[var(--oro)] text-white font-semibold shadow-sm'
                  : 'text-[var(--oro)] bg-[var(--oro-fondo)]'
              }`}
            >
              <Crown className="w-3.5 h-3.5 stroke-[1.8]" />
              <span>Suscripción</span>
            </button>
          </nav>
        </div>

        {/* Contenido principal en mobile */}
        <main className="p-4 flex-grow min-w-0">{children}</main>
      </div>
    </div>
  )
}
