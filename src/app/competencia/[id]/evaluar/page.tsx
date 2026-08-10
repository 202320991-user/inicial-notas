'use client';

import Link from 'next/link';
import { use, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw, Trash2, Eye, Check, ClipboardList, BookOpen, Sparkles, Mic, MicOff } from 'lucide-react';
import { useFicha } from '@/lib/useFicha';
import { MAX_NINOS } from '@/lib/competencias';
import { claseNivel, claseNivelBadge, etiquetaNivel, obtenerIniciales, colorDeArea, formatearCapacidades } from '@/lib/ui';
import { Nivel } from '@/types';

const NIVELES: Nivel[] = ['L', 'EP', 'I'];

interface EventoReconocimiento {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface EventoErrorReconocimiento {
  error: string;
}

interface ReconocimientoVoz {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onresult: ((event: EventoReconocimiento) => void) | null;
  onerror: ((event: EventoErrorReconocimiento) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type ConstructorReconocimientoVoz = new () => ReconocimientoVoz;

function obtenerConstructorReconocimiento(): ConstructorReconocimientoVoz | undefined {
  const ventana = window as Window & {
    SpeechRecognition?: ConstructorReconocimientoVoz;
    webkitSpeechRecognition?: ConstructorReconocimientoVoz;
  };

  return ventana.SpeechRecognition || ventana.webkitSpeechRecognition;
}

export default function EvaluarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const evaluacionId = searchParams.get('evaluacionId') || undefined;

  const f = useFicha(id, evaluacionId);
  const color = colorDeArea(f.competenciaInfo?.area ?? '');

  // Estado y referencia para la grabación de voz por niño
  const [grabandoIndex, setGrabandoIndex] = useState<number | null>(null);
  const recognitionRef = useRef<ReconocimientoVoz | null>(null);

  useEffect(() => {
    // Inicialización de la API en el cliente de manera segura
    const SpeechRecognition = obtenerConstructorReconocimiento();
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-PE';
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleGrabacionVoz = (idx: number, textoActual: string) => {
    const SpeechRecognition = obtenerConstructorReconocimiento();

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta el reconocimiento de voz. Te recomendamos usar Google Chrome.');
      return;
    }

    // Si ya está grabando este niño, detener la grabación manualmente
    if (grabandoIndex === idx) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignorar si ya estaba detenido
        }
      }
      setGrabandoIndex(null);
      return;
    }

    // Si hay otra grabación activa de otro niño, detenerla primero
    if (recognitionRef.current && grabandoIndex !== null) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
    }

    // Reinstanciar para asegurar frescura en el evento del clic del usuario
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setGrabandoIndex(idx);
      console.log('Micrófono escuchando...');
    };

    recognition.onspeechend = () => {
      console.log('Silencio detectado, manteniendo el micro activo...');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }

      if (transcript.trim()) {
        const nuevoTexto = textoActual
          ? `${textoActual.trim()} ${transcript.trim()}`
          : transcript.trim();
        f.handleObservacion(idx, nuevoTexto);
      }
    };

    recognition.onerror = (event) => {
      // Ignorar el error 'no-speech' para evitar que se corte por pausas breves
      if (event.error === 'no-speech') {
        console.warn('Silencio detectado por el navegador, continuando...');
        return;
      }

      console.error('Error de micrófono:', event.error);
      setGrabandoIndex(null);
      if (event.error === 'not-allowed') {
        alert('Permiso denegado. Asegúrate de permitir el micrófono en tu navegador.');
      }
    };

    recognition.onend = () => {
      // Solo limpiar si realmente terminó por completo y no fue un reinicio interno
      setGrabandoIndex((prevIndex) => (prevIndex === idx ? null : prevIndex));
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('No se pudo iniciar el reconocimiento:', err);
      setGrabandoIndex(null);
    }
  };

  if (f.error) {
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{f.error}</p>
      </main>
    );
  }

  if (f.cargando) {
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <p className="text-sm text-slate-400">Cargando plantilla...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] border border-slate-200 space-y-6">
        
        {/* Referencia de los Datos de la Ficha (Solo Texto / Lectura) */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={20} className="text-[#006492]" /> Información de Referencia
            </h2>
            <Link
              href={`/competencia/${id}/editar${evaluacionId ? `?evaluacionId=${evaluacionId}` : ''}`}
              className="text-xs text-[#006492] font-semibold hover:underline flex items-center gap-1"
            >
              Editar plantilla ✎
            </Link>
          </div>

          {(f.competenciaTexto || f.capacidadesTexto !== undefined) && (
            <div className={`rounded-2xl border ${color.border} ${color.light} p-4 space-y-3 shadow-sm`}>
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${color.text}`}>
                  <BookOpen size={16} className="shrink-0" /> Competencia Oficial
                </span>
                <span className="text-[10px] bg-white/80 backdrop-blur-sm text-slate-500 font-semibold px-2.5 py-0.5 rounded-full border border-black/5">
                  CNB / Currículo
                </span>
              </div>

              {f.competenciaTexto && (
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {f.competenciaTexto}
                </p>
              )}

              {f.capacidadesTexto && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500 shrink-0" />
                    Capacidades Evaluadas
                  </span>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-5">
                    {formatearCapacidades(f.capacidadesTexto)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 block mb-0.5">Unidad:</span>
              <p className="text-slate-800 font-semibold">{f.unidad || 'Sin registrar'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-500 block mb-0.5">Actividad:</span>
              <p className="text-slate-800 font-semibold">{f.actividad || 'Sin registrar'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-500 block mb-0.5">Fecha de Evaluación:</span>
              <p className="text-slate-800 font-semibold">{f.fecha || 'Sin registrar'}</p>
            </div>
            <div className="md:col-span-3 pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-500 block mb-0.5">Criterio de Evaluación:</span>
              <p className="text-slate-800 leading-relaxed">{f.criterio || 'Sin registrar'}</p>
            </div>
          </div>
        </div>

        {f.items.length === 0 || f.items.every((i) => !i.trim()) ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Aún no has configurado los indicadores de esta ficha.{' '}
            <Link href={`/competencia/${id}/editar${evaluacionId ? `?evaluacionId=${evaluacionId}` : ''}`} className="underline font-semibold">
              Ve a &quot;Editar Plantilla&quot;
            </Link>{' '}
            primero.
          </p>
        ) : null}

        {/* Escala / Leyenda oficial */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-700 mb-1">Escala / Leyenda Oficial:</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> <strong>L:</strong> Logrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> <strong>EP:</strong> En Proceso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> <strong>I:</strong> En Inicio
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-800">
            Niños a evaluar en esta sesión ({f.ninos.length}/{MAX_NINOS})
            {f.guardadoNinosEn && <span className="ml-2 text-xs font-normal text-slate-400 inline-flex items-center gap-1"><Check size={14} /> Guardado</span>}
          </h2>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Borrar los datos de los niños de esta sesión (nombres, notas y observaciones)?')) f.reiniciarNinos();
              }}
              className="text-xs bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-semibold border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Limpiar sesión
            </button>
            {f.alumnosDisponibles.length > 0 ? (
              <select
                value=""
                onChange={(e) => f.agregarNinoDesdeLista(e.target.value)}
                className="text-xs bg-[#e6f2f8] text-[#006492] px-2 py-1.5 rounded-lg font-semibold border border-[#006492]/20"
              >
                <option value="">+ Elegir de mi lista</option>
                {f.alumnosDisponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            ) : (
              f.ninos.length < MAX_NINOS && (
                <Link href="/alumnos" className="text-xs text-slate-400 underline">
                  Agrega más alumnos a tu lista para poder elegirlos aquí
                </Link>
              )
            )}
          </div>
        </div>

        {f.indicadoresActivos.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-lg [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="sticky left-0 z-10 bg-slate-100 text-left font-bold text-slate-700 p-2 w-64">Indicador</th>
                  {f.ninos.map((n, idx) => (
                    <th key={n.id} className="p-2 min-w-[140px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-[#006492] text-white text-[10px] font-bold flex items-center justify-center">
                          {obtenerIniciales(n.nombre || '?')}
                        </div>
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={n.nombre}
                            onChange={(e) => f.handleNombreChange(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-semibold bg-white text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (f.ninos.length <= 1) return;
                              const tieneDatos = n.nombre.trim() !== '' && (n.calificaciones.some(Boolean) || n.observacionDescriptiva.trim() !== '');
                              if (tieneDatos && !confirm(`¿Quitar a "${n.nombre}" de esta ficha? Se perderán sus calificaciones y observación.`)) return;
                              f.eliminarNino(idx);
                            }}
                            className="text-red-500 hover:bg-red-50 rounded p-1"
                            title="Eliminar niño"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.indicadoresActivos.map(({ texto, idx: indicadorIdx }) => (
                  <tr key={indicadorIdx} className="border-t border-slate-100 even:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white even:bg-slate-50 p-2 text-slate-700 align-top">{texto}</td>
                    {f.ninos.map((n, ninoIdx) => (
                      <td key={n.id} className="p-2 align-top">
                        <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 w-full">
                          {NIVELES.map((nivel, i) => (
                            <button
                              key={nivel}
                              type="button"
                              onClick={() => f.handleCalificacion(ninoIdx, indicadorIdx, nivel)}
                              className={`flex-1 px-1.5 py-1 text-[11px] font-bold transition-all ${i > 0 ? 'border-l border-slate-300' : ''} ${claseNivel(
                                nivel,
                                n.calificaciones[indicadorIdx] === nivel
                              )}`}
                            >
                              {nivel}
                            </button>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Aún no hay indicadores con texto. Ve a &quot;Editar Plantilla&quot; y complétalos antes de calificar.
          </p>
        )}

        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">Registro descriptivo por niño</h2>
          {f.ninos.map((n, idx) => {
            const totalIndicadores = f.indicadoresActivos.length;
            const calificados = n.calificaciones.filter(Boolean).length;
            const completo = totalIndicadores > 0 && calificados === totalIndicadores;
            const estaGrabando = grabandoIndex === idx;

            return (
              <div
                key={n.id}
                className={`p-4 border border-slate-200 rounded-xl space-y-3 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] ${
                  completo ? 'bg-green-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-[#006492] text-white text-xs font-bold flex items-center justify-center">
                    {obtenerIniciales(n.nombre || '?')}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{n.nombre || '(sin nombre)'}</span>

                  {totalIndicadores > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        completo ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {calificados}/{totalIndicadores} calificados
                    </span>
                  )}
                  {n.nivelAlcanzado && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${claseNivelBadge(n.nivelAlcanzado)}`}>
                      {etiquetaNivel(n.nivelAlcanzado)} ({n.nivelAlcanzado})
                    </span>
                  )}

                  <div className="inline-flex rounded-lg overflow-hidden border border-slate-300">
                    {NIVELES.map((nivel, i) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => f.handleNivelManual(idx, nivel)}
                        className={`px-3.5 py-2.5 text-xs font-bold transition-all min-h-[44px] ${i > 0 ? 'border-l border-slate-300' : ''} ${claseNivel(
                          nivel,
                          n.nivelAlcanzado === nivel
                        )}`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Área del textarea con botón de micrófono */}
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Escribe la observación descriptiva o usa el micrófono..."
                    value={n.observacionDescriptiva}
                    onChange={(e) => f.handleObservacion(idx, e.target.value)}
                    className="w-full border border-slate-300 p-2 pr-10 rounded-lg text-xs bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => toggleGrabacionVoz(idx, n.observacionDescriptiva)}
                    title={estaGrabando ? 'Detener grabación' : 'Dictar por voz'}
                    className={`absolute right-2 bottom-3 p-1.5 rounded-full transition-all ${
                      estaGrabando
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {estaGrabando ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href={`/competencia/${id}/vista-previa${evaluacionId ? `?evaluacionId=${evaluacionId}` : ''}`}
          className="w-full bg-[#006492] hover:opacity-90 text-white font-semibold py-3 rounded-full shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Eye size={18} /> Ver Vista Previa y Descargar
        </Link>
      </div>
    </main>
  );
}
