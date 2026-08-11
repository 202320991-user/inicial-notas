'use client';

import { useEffect, useMemo, useState } from 'react';
import { EvaluacionGuardada } from '@/types';

export interface UnidadReciente {
  nombre: string;
  ultimoUso: string;
  cantidadRegistros: number;
  diasDesdeUltimoUso: number;
}

interface RespuestaDrive {
  ok?: boolean;
  evaluaciones?: EvaluacionGuardada[];
  error?: string;
}

function fechaLocal(fecha: string): Date | null {
  if (!fecha) return null;

  const partes = fecha.split('-').map(Number);

  if (partes.length !== 3) return null;

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) return null;

  const resultado = new Date(anio, mes - 1, dia);

  if (Number.isNaN(resultado.getTime())) {
    return null;
  }

  return resultado;
}

function normalizarUnidad(unidad: string): string {
  return unidad
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-PE');
}

function diferenciaDias(fechaReferencia: Date, fechaRegistro: Date): number {
  const referencia = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate()
  );

  const registro = new Date(
    fechaRegistro.getFullYear(),
    fechaRegistro.getMonth(),
    fechaRegistro.getDate()
  );

  return Math.floor(
    (referencia.getTime() - registro.getTime()) / 86_400_000
  );
}

export function useUnidadesRecientes(fechaReferencia: string) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionGuardada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError('');

      try {
        const response = await fetch('/api/drive/listar', {
          cache: 'no-store',
        });

        const texto = await response.text();

        let data: RespuestaDrive;

        try {
          data = JSON.parse(texto);
        } catch {
          throw new Error(
            'El servidor devolvió una respuesta inesperada.'
          );
        }

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || 'No se pudo consultar el historial.'
          );
        }

        if (!cancelado) {
          setEvaluaciones(
            Array.isArray(data.evaluaciones)
              ? data.evaluaciones
              : []
          );
        }
      } catch (e) {
        console.error('Error cargando unidades recientes:', e);

        if (!cancelado) {
          setError(
            e instanceof Error
              ? e.message
              : 'No se pudieron cargar las unidades recientes.'
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, []);

  const unidades = useMemo(() => {
    const referencia =
      fechaLocal(fechaReferencia) ?? new Date();

    const agrupadas = new Map<
      string,
      {
        nombre: string;
        ultimoUso: string;
        cantidadRegistros: number;
        diasDesdeUltimoUso: number;
      }
    >();

    evaluaciones.forEach((evaluacion) => {
      const nombre = evaluacion.unidad?.trim();
      const fecha = fechaLocal(evaluacion.fecha);

      if (!nombre || !fecha) return;

      const dias = diferenciaDias(referencia, fecha);

      // No mostramos registros posteriores a la fecha
      // de la ficha que estamos creando.
      if (dias < 0) return;

      const clave = normalizarUnidad(nombre);

      const existente = agrupadas.get(clave);

      if (!existente) {
        agrupadas.set(clave, {
          nombre,
          ultimoUso: evaluacion.fecha,
          cantidadRegistros: 1,
          diasDesdeUltimoUso: dias,
        });

        return;
      }

      existente.cantidadRegistros += 1;

      if (dias < existente.diasDesdeUltimoUso) {
        existente.nombre = nombre;
        existente.ultimoUso = evaluacion.fecha;
        existente.diasDesdeUltimoUso = dias;
      }
    });

    return Array.from(agrupadas.values()).sort(
      (a, b) =>
        a.diasDesdeUltimoUso - b.diasDesdeUltimoUso
    );
  }, [evaluaciones, fechaReferencia]);

  const recientes = useMemo(
    () =>
      unidades.filter(
        (unidad) => unidad.diasDesdeUltimoUso <= 15
      ),
    [unidades]
  );

  const anteriores = useMemo(
    () =>
      unidades.filter(
        (unidad) => unidad.diasDesdeUltimoUso > 15
      ),
    [unidades]
  );

  return {
    unidades,
    recientes,
    anteriores,
    cargando,
    error,
  };
}