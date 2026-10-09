import React from 'react'

export function Pastilla({ children, variante = 'vino', className = '' }) {
  let styles = 'num text-[11.5px] font-bold px-2.5 py-1 rounded-[8px] inline-flex items-center gap-1.5'

  if (variante === 'vino') {
    styles += ' bg-[var(--vino-suave)] text-[var(--vino-oscuro)]'
  } else if (variante === 'verde') {
    styles += ' bg-[var(--verde-fondo)] text-[var(--verde)]'
  } else if (variante === 'oro') {
    styles += ' bg-[var(--oro-fondo)] text-[var(--oro)]'
  } else if (variante === 'neutral') {
    styles += ' bg-[var(--linea-suave)] text-[var(--tinta-media)]'
  }

  return <span className={`${styles} ${className}`}>{children}</span>
}
