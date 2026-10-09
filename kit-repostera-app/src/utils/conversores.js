import { densidadTazas as densidadBase } from './tablasConversion.js'

export const densidadTazas = {
  ...densidadBase,
  'Harina': 125,
  'Harina sin polvos': 125,
  'Harina con polvos': 125
};

export function obtenerDensidad(nombre) {
  if (!nombre) return 120;
  if (densidadTazas[nombre]) return densidadTazas[nombre];
  
  const norm = nombre.toLowerCase().trim();
  for (const key of Object.keys(densidadTazas)) {
    if (norm === key.toLowerCase().trim()) {
      return densidadTazas[key];
    }
  }
  // Coincidencia parcial si contiene palabras clave comunes
  if (norm.includes('harina')) return 125;
  if (norm.includes('azucar') || norm.includes('azúcar')) return 250;
  if (norm.includes('aceite')) return 180;
  if (norm.includes('mantequilla')) return 225;
  if (norm.includes('leche')) return 250;
  
  return 120;
}

export function normalizarTextoFlex(txt) {
  const norm = (txt || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  if (norm.length <= 4) return norm
  return norm.replace(/s$/, '')
}

export function factorBase(unidad) {
  if (unidad === 'kg' || unidad === 'l') return 1000;
  return 1;
}

export function unidadBaseDe(unidad) {
  if (unidad === 'kg' || unidad === 'g') return 'g';
  if (unidad === 'l' || unidad === 'ml') return 'ml';
  return 'unidad';
}

export function convertirACantidadBase(item, ing, multiplicador = 1) {
  if (!ing || !item) return 0;
  const cantEscalada = (parseFloat(item.cant || item.cantidad) || 0) * multiplicador;
  let cantConvertida = cantEscalada;
  const u = (item.unidad || '').toLowerCase().trim();

  // Columna Supabase unidad_base
  const unidadBase = ing.unidad_base || ing.unidadBase;
  const dens = obtenerDensidad(item.nombre);

  if (unidadBase === 'g') {
    if (u === 'kg') cantConvertida = cantEscalada * 1000;
    else if (u === 'g') cantConvertida = cantEscalada;
    else if (u === 'oz') cantConvertida = cantEscalada * 28.34952;
    else if (u === 'lb') cantConvertida = cantEscalada * 453.59237;
    else if (u === 'mg') cantConvertida = cantEscalada * 0.001;
    else if (u === 'taza') cantConvertida = cantEscalada * dens;
    else if (u === 'cda') cantConvertida = cantEscalada * (dens / 16);
    else if (u === 'cdta') cantConvertida = cantEscalada * (dens / 48);
  } else if (unidadBase === 'ml') {
    if (u === 'l') cantConvertida = cantEscalada * 1000;
    else if (u === 'ml') cantConvertida = cantEscalada;
    else if (u === 'taza') cantConvertida = cantEscalada * 240;
    else if (u === 'cda') cantConvertida = cantEscalada * 15;
    else if (u === 'cdta') cantConvertida = cantEscalada * 5;
    else if (u === 'oz' || u === 'oz-fl') cantConvertida = cantEscalada * 29.5735;
  } else if (unidadBase === 'unidad') {
    cantConvertida = cantEscalada;
  }
  return Math.round(cantConvertida * 1000) / 1000;
}

export const CLP = (n, maxDec = 2) => 
  '$' + (typeof n === 'number' ? n : (parseFloat(n) || 0)).toLocaleString('es-CL', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: maxDec 
  });
