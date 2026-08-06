'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { COMPETENCIAS } from '@/lib/competencias';
import { agruparPorArea, colorDeArea } from '@/lib/ui';
import { leerJSON } from '@/lib/storage';
import { MoldeGuardado, NinoGuardado } from '@/types';
import { CheckCircle2, Clock, Users } from 'lucide-react';

interface EstadoCompetencia {
  configurada: boolean;
  niñosEnSesion: number;
}

export default function Home() {
  const [estados, setEstados] = useState<Record<string, EstadoCompetencia>>({});
  const [mounted, setMounted] = useState(false);

  const areas = useMemo(() => agruparPorArea(COMPETENCIAS), []);

  useEffect(() => {
    const nuevo: Record<string, EstadoCompetencia> = {};

    COMPETENCIAS.forEach((c) => {
      const molde = leerJSON<MoldeGuardado | null>(`molde_${c.id}`, null);
      const sesion = leerJSON<NinoGuardado[]>(`sesion_${c.id}`, []);
      
      nuevo[c.id] = {
        configurada: Boolean(molde),
        niñosEnSesion: sesion.filter((n) => n.nombre?.trim()).length,
      };
    });

    setEstados(nuevo);
    setMounted(true);
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 pb-24 font-sans text-slate-800">
      {/* Header con bienvenida */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bienvenida</h1>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Selecciona una competencia para editar la plantilla, evaluar a tus alumnos o ver el historial guardado.
        </p>
      </div>

      {/* Grid por Áreas */}
      <div className="space-y-10">
        {areas.map(([area, lista]) => {
          const color = colorDeArea(area);

          return (
            <section key={area} className="space-y-4">
              {/* Encabezado del Área */}
              <div className="flex items-center gap-2.5 pl-1">
                <span className={`w-2.5 h-6 rounded-full ${color.bg}`} />
                <h2 className={`text-xs md:text-sm font-bold uppercase tracking-wider ${color.text}`}>
                  Área: {area}
                </h2>
              </div>

              {/* Grid de Fichas Pastel */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lista.map((c) => {
                  const estado = estados[c.id];
                  const tieneSesion = estado?.niñosEnSesion > 0;

                  return (
                    <Link
                      key={c.id}
                      href={`/competencia/${c.id}/editar`}
                      className={`group relative overflow-hidden ${color.light} rounded-3xl p-5 border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between`}
                    >
                      {/* Borde superior de acento */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${color.bg} opacity-80`} />

                      <div>
                        {/* Cabecera de la ficha */}
                        <div className="flex justify-between items-start gap-3 mb-4 pt-1">
                          <div className="w-14 h-14 rounded-2xl bg-white p-2.5 shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Image
                              src={color.iconSrc}
                              alt={`Ícono de ${area}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {mounted ? (
                            <span
                              className={`px-3 py-1 text-[11px] font-bold rounded-full flex items-center gap-1.5 shrink-0 shadow-2xs ${
                                estado?.configurada
                                  ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-white/90 text-slate-500 border border-slate-200/70'
                              }`}
                            >
                              {estado?.configurada ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Configurada</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Pendiente</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="w-20 h-6 bg-white/70 rounded-full animate-pulse" />
                          )}
                        </div>

                        {/* Nombre de la competencia */}
                        <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-[#006492] transition-colors leading-snug mb-5 line-clamp-2">
                          {c.nombre}
                        </h3>
                      </div>

                      {/* Pie de la ficha */}
                      <div className="pt-3.5 border-t border-slate-900/5 flex items-center justify-between text-xs font-medium">
                        {mounted ? (
                          tieneSesion ? (
                            <div className="flex items-center gap-2 text-slate-700 bg-white/70 px-3 py-1.5 rounded-xl border border-white/80 shadow-2xs">
                              <Users className="w-3.5 h-3.5 text-[#006492]" />
                              <span>
                                <strong>{estado.niñosEnSesion}</strong> {estado.niñosEnSesion === 1 ? 'alumno' : 'alumnos'} en sesión
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal px-1">Sin alumnos en sesión</span>
                          )
                        ) : (
                          <span className="w-28 h-4 bg-white/70 rounded-md animate-pulse" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}