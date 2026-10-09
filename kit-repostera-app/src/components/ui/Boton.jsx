import React from 'react'

export function Boton({
  children,
  variante = 'principal',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  onClick,
  ariaLabel,
  ...props
}) {
  let baseStyles =
    'inline-flex items-center justify-center gap-2 font-sans font-bold text-[12.5px] rounded-[11px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'

  let variantStyles = ''
  if (variante === 'principal') {
    variantStyles =
      'bg-[var(--vino)] hover:bg-[var(--vino-oscuro)] text-white shadow-[var(--sombra-boton)]'
  } else if (variante === 'secundario') {
    variantStyles =
      'bg-white border border-[var(--linea)] hover:bg-[var(--superficie-2)] text-[var(--tinta-media)]'
  } else if (variante === 'marca-secundario') {
    variantStyles =
      'bg-white border border-[var(--vino-borde)] text-[var(--vino)] hover:bg-[var(--vino-suave)]'
  } else if (variante === 'icono') {
    variantStyles =
      'bg-transparent text-[var(--tinta-suave)] hover:text-[var(--tinta)] hover:bg-black/5 rounded-lg'
  }

  let sizeStyles = ''
  if (size === 'sm') sizeStyles = 'h-[36px] px-3'
  else if (size === 'md') sizeStyles = 'h-[42px] px-4'
  else if (size === 'lg') sizeStyles = 'h-[48px] px-6 text-sm'
  else if (size === 'icono') sizeStyles = 'w-[36px] h-[36px] p-0'

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
