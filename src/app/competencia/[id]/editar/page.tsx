'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ClipboardList, 
  BookOpen, 
  Trash2, 
  Plus, 
  Check, 
  AlertCircle,
  RotateCcw,
  Sparkles,
  Pencil
} from 'lucide-react';
import { useFicha } from '@/lib/useFicha';
import { colorDeArea, inputClase, formatearCapacidades } from '@/lib/ui';

export default function EditarPlantillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const evaluacionId = searchParams.get('evaluacionId') || undefined;
  
  const f = useFicha(id, evaluacionId);
  const color = colorDeArea(f.competenciaInfo?.area ?? '');

  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    titulo: string;
    mensaje: string;
    onConfirm: () => void;
  } | null>(null);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 4000);
  };

  const solicitarRestaurarOriginal = () => {
    setModalConfirmacion({
      titulo: '¿Restaurar plantilla original?',
      mensaje: 'Se reemplazarán el criterio y los indicadores por los valores oficiales por defecto.',
      onConfirm: () => f.restaurarPlantillaOriginal()
    });
  };

  const agregarIndicador = () => {
    const excedeFilas = f.agregarIndicador();
    if (excedeFilas) {
      mostrarNotificacion(
        `Atención: La plantilla física solo tiene ${f.filasPlantilla} filas impresas.`
      );
    }
  };

  const solicitarEliminarIndicador = (idx: number, texto: string) => {
    if (!texto.trim()) {
      f.eliminarIndicador(idx);
      return;
    }

    setModalConfirmacion({
      titulo: '¿Quitar indicador?',
      mensaje: '¿Estás seguro de quitar este indicador de la ficha actual?',
      onConfirm: () => f.eliminarIndicador(idx)
    });
  };

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20 relative">
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span>{notificacion}</span>
        </div>
      )}

      {f.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle size={18} /> {f.error}
        </p>
      )}

      {f.cargando ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
          Cargando plantilla de evaluación...
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={20} className="text-[#006492]" /> Datos de la Ficha
            </h2>
            {f.guardadoMoldeEn && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium flex items-center gap-1 border border-emerald-200/60">
                <Check size={14} /> Guardado
              </span>
            )}
          </div>

          {(f.competenciaTexto || f.capacidadesTexto !== undefined) && (
            <div className={`rounded-2xl border ${color.border} ${color.light} p-4 md:p-5 space-y-4 shadow-sm`}>
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${color.text}`}>
                  <BookOpen size={16} className="shrink-0" /> Competencia Oficial
                </span>
                <span className="text-[10px] bg-white/80 backdrop-blur-sm text-slate-500 font-semibold px-2.5 py-0.5 rounded-full border border-black/5">
                  CNB / Currículo
                </span>
              </div>

              {/* Título y Estándar de Aprendizaje Divididos */}
              {f.competenciaTexto && (() => {
                const partes = f.competenciaTexto.split('.');
                const titulo = partes[0];
                const estandar = partes.slice(1).join('.').trim();

                return (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {titulo}.
                    </h3>
                    {estandar && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {estandar}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Capacidades Evaluadas */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500 shrink-0" />
                    Capacidades Evaluadas
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Pencil size={12} /> Editable
                  </span>
                </div>
                <textarea
                  value={formatearCapacidades(f.capacidadesTexto || '')}
                  onChange={(e) => f.setCapacidadesTexto(e.target.value)}
                  placeholder="Escribe o ajusta las capacidades correspondientes..."
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-normal leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#006492]/20 focus:border-[#006492] transition-all resize-y shadow-inner whitespace-pre-line"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad</label>
              <input
                type="text"
                placeholder="Ej. Unidad 1"
                value={f.unidad}
                onChange={(e) => f.setUnidad(e.target.value)}
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Actividad</label>
              <input
                type="text"
                placeholder="Ej. Jugando con las palabras"
                value={f.actividad}
                onChange={(e) => f.setActividad(e.target.value)}
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Evaluación</label>
              <input 
                type="date" 
                value={f.fecha} 
                onChange={(e) => f.setFecha(e.target.value)} 
                className={inputClase} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Criterio de Evaluación</label>
            <textarea
              value={f.criterio}
              onChange={(e) => f.setCriterio(e.target.value)}
              placeholder="Escribe el criterio..."
              className={`${inputClase} resize-none`}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Indicadores de Evaluación
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({f.items.length} de {f.filasPlantilla} filas impresas)
                </span>
              </label>
              <button
                type="button"
                onClick={solicitarRestaurarOriginal}
                className="text-xs text-slate-500 hover:text-[#006492] font-medium flex items-center gap-1"
              >
                <RotateCcw size={13} /> Restaurar originales
              </button>
            </div>

            <div className="space-y-2">
              {f.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-slate-400 mt-3 w-5 text-right">{idx + 1}.</span>
                  <textarea
                    placeholder={`Indicador ${idx + 1}`}
                    value={item}
                    onChange={(e) => f.handleItemChange(e.target.value, idx)}
                    rows={2}
                    className={`flex-1 ${inputClase} resize-none`}
                  />
                  <button
                    type="button"
                    onClick={() => solicitarEliminarIndicador(idx, item)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 mt-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarIndicador}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 hover:border-[#006492] hover:text-[#006492] transition-all text-xs font-semibold"
            >
              <Plus size={16} /> Agregar indicador
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`/competencia/${id}/evaluar${evaluacionId ? `?evaluacionId=${evaluacionId}` : ''}`}
              className="flex-1 bg-[#006492] hover:bg-[#005278] text-white font-semibold py-2.5 rounded-xl transition text-xs text-center flex items-center justify-center shadow-sm"
            >
              Continuar a Evaluar →
            </Link>
          </div>
        </div>
      )}

      {modalConfirmacion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800">{modalConfirmacion.titulo}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{modalConfirmacion.mensaje}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  modalConfirmacion.onConfirm();
                  setModalConfirmacion(null);
                }}
                className="px-4 py-2 bg-[#006492] hover:bg-[#005278] text-white rounded-lg text-xs font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}