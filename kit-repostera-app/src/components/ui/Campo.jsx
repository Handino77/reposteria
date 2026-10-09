import React from 'react'

export function Campo({ label, error, children, id, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[11.5px] font-semibold text-[var(--tinta-media)]">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
    </div>
  )
}

export function Input({ id, type = 'text', className = '', ...props }) {
  return (
    <input
      id={id}
      type={type}
      className={`h-[44px] border border-[#DFD3C7] bg-[var(--superficie-2)] rounded-[11px] px-3 font-sans text-[13.5px] text-[var(--tinta)] outline-none transition-all focus:border-[var(--vino-borde)] focus:ring-2 focus:ring-[var(--vino)]/10 disabled:opacity-50 w-full ${className}`}
      {...props}
    />
  )
}

export function Select({ id, className = '', children, ...props }) {
  return (
    <select
      id={id}
      className={`h-[44px] border border-[#DFD3C7] bg-[var(--superficie-2)] rounded-[11px] px-3 font-sans text-[13.5px] text-[var(--tinta)] outline-none transition-all focus:border-[var(--vino-borde)] focus:ring-2 focus:ring-[var(--vino)]/10 disabled:opacity-50 w-full ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
