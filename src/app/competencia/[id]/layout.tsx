'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList, ListChecks, Eye } from 'lucide-react';
import { getCompetencia } from '@/lib/competencias';
import { colorDeArea } from '@/lib/ui';
import { haySesionSinGuardar, descartarSesion } from '@/lib/sesionFicha';

export default function CompetenciaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const competencia = getCompetencia(id);
  const pathname = usePathname();
  const evaluacionId = useSearchParams().get('evaluacionId');

  const handleVolverInicio = (e: React.MouseEvent) => {
    if (evaluacionId) return;
    if (haySesionSinGuardar(id)) {
      const confirmar = window.confirm(
        '¿Deseas volver al inicio? Los datos de esta sesión que no guardaste en el Drive se perderán.'
      );
      if (!confirmar) {
        e.preventDefault();
        return;
      }
    }
    descartarSesion(id);
  };

  if (!competencia) {
    return (
      <main className="max-w-3xl mx-auto p-8 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
          Competencia no encontrada: &quot;{id}&quot;.
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-[#006492] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </main>
    );
  }

  const color = colorDeArea(competencia.area);
  const tabs = [
    { href: `/competencia/${id}/editar`, label: 'Editar Plantilla', Icon: ClipboardList },
    { href: `/competencia/${id}/evaluar`, label: 'Evaluar', Icon: ListChecks },
    { href: `/competencia/${id}/vista-previa`, label: 'Vista Previa', Icon: Eye },
  ];

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-6">
        {/* Card del encabezado de la competencia */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
          <Link 
            href="/" 
            onClick={handleVolverInicio} 
            className="text-xs font-semibold text-slate-400 hover:text-[#006492] transition-colors flex items-center gap-1.5 w-fit mb-3"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <div className="flex items-center gap-4">
            {/* Contenedor del ícono con fondo del área */}
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl p-2.5 flex items-center justify-center shrink-0 ${color.light} border border-slate-100 shadow-xs`}>
              <Image 
                src={color.iconSrc} 
                alt={`Ícono de ${competencia.area}`} 
                width={48} 
                height={48} 
                className="w-full h-full object-contain" 
              />
            </div>

            <div>
              {/* Badge dinámico con el color distintivo del área */}
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${color.light} ${color.text}`}>
                {competencia.area}
              </span>
              <h1 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">
                {competencia.nombre}
              </h1>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas estilizada */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const activo = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl -mb-px border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                  activo 
                    ? `${color.text} ${color.light} border-current shadow-xs` 
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <tab.Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
