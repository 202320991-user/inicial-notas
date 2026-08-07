import { CompetenciaInfo } from '@/lib/competencias';
import { Nivel } from '@/types';

export const COLOR_AREA: Record<
  string, 
  { bg: string; text: string; light: string; border: string; iconSrc: string }
> = {
  'Comunicación': { 
    bg: 'bg-[#006492]', 
    text: 'text-[#006492]', 
    light: 'bg-[#e6f2f8]', 
    border: 'border-[#006492]/30', 
    iconSrc: '/images/area-comunicacion.png' 
  },
  'Matemática': { 
    bg: 'bg-[#904d00]', 
    text: 'text-[#904d00]', 
    light: 'bg-[#fff3e0]', 
    border: 'border-[#904d00]/30', 
    iconSrc: '/images/area-matematica.png' 
  },
  'Personal Social': { 
    bg: 'bg-[#8135c5]', 
    text: 'text-[#8135c5]', 
    light: 'bg-[#f3e5f5]', 
    border: 'border-[#8135c5]/30', 
    iconSrc: '/images/area-personal-social.png' 
  },
  'Ciencia': { 
    bg: 'bg-[#2e7d32]', 
    text: 'text-[#2e7d32]', 
    light: 'bg-[#e8f5e9]', 
    border: 'border-[#2e7d32]/30', 
    iconSrc: '/images/area-ciencia.png' 
  },
  'Psicomotricidad': { 
    bg: 'bg-[#c99a00]', 
    text: 'text-[#8a6d00]', 
    light: 'bg-[#fff9c4]', 
    border: 'border-[#c99a00]/30', 
    iconSrc: '/images/area-psicomotricidad.png' 
  },
};

const COLOR_AREA_DEFAULT = { 
  bg: 'bg-slate-500', 
  text: 'text-slate-600', 
  light: 'bg-slate-100', 
  border: 'border-slate-300', 
  iconSrc: '/images/area-comunicacion.png' 
};

export function colorDeArea(area: string) {
  return COLOR_AREA[area] ?? COLOR_AREA_DEFAULT;
}

export function formatearCapacidades(texto: string): string {
  if (!texto) return '';

  // Si ya contiene saltos de línea, normaliza espacios por cada línea
  if (texto.includes('\n')) {
    return texto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  // Si viene continuo, convierte puntos seguidos de espacio en saltos de línea
  return texto
    .split(/\.\s+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.endsWith('.') ? l : `${l}.`))
    .join('\n');
}

export function agruparPorArea(lista: CompetenciaInfo[]): [string, CompetenciaInfo[]][] {
  const grupos: Record<string, CompetenciaInfo[]> = {};
  lista.forEach((c) => {
    if (!grupos[c.area]) grupos[c.area] = [];
    grupos[c.area].push(c);
  });
  return Object.entries(grupos);
}

export function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function claseNivel(nivel: Nivel, activo: boolean): string {
  if (!activo) return 'bg-white text-slate-500 hover:bg-slate-50';
  if (nivel === 'L') return 'bg-green-600 text-white';
  if (nivel === 'EP') return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}

export function etiquetaNivel(nivel: Nivel): string {
  if (nivel === 'L') return 'LOGRADO';
  if (nivel === 'EP') return 'EN PROCESO';
  if (nivel === 'I') return 'EN INICIO';
  return '';
}

export function claseNivelBadge(nivel: Nivel): string {
  if (nivel === 'L') return 'bg-green-100 text-green-700';
  if (nivel === 'EP') return 'bg-amber-100 text-amber-700';
  if (nivel === 'I') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-500';
}

export const inputClase =
  'w-full bg-[#f2f2f2] border-0 border-b-2 border-slate-300 focus:border-[#006492] focus:ring-0 rounded-t-lg px-3 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400';