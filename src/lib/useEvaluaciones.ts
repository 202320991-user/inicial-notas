'use client';

import { useCallback, useEffect, useState } from 'react';
import { EvaluacionGuardada } from '@/types';

type RespuestaDrive = {
  ok: boolean;
  total?: number;
  evaluaciones?: EvaluacionGuardada[];
  error?: string;
};

type RespuestaEliminar = {
  ok: boolean;
  mensaje?: string;
  evaluacionId?: string;
  jsonEliminados?: number;
  excelEliminados?: number;
  error?: string;
};

export function useEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionGuardada[]>([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setCargado(false);
    setError('');

    try {
      const response = await fetch('/api/drive/listar', {
        method: 'GET',
        cache: 'no-store',
      });

      const data: RespuestaDrive = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            'No se pudieron cargar las evaluaciones desde Google Drive.'
        );
      }

      setEvaluaciones(data.evaluaciones || []);
    } catch (e) {
      console.error('Error cargando evaluaciones desde Google Drive:', e);

      setEvaluaciones([]);
      setError(
        e instanceof Error
          ? e.message
          : 'Error desconocido al consultar Google Drive.'
      );
    } finally {
      setCargado(true);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const eliminar = useCallback(
    async (id: string): Promise<RespuestaEliminar> => {
      const evaluacionId = id.trim();

      if (!evaluacionId) {
        throw new Error('No se recibió el id de la evaluación.');
      }

      try {
        const response = await fetch('/api/drive/eliminar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: evaluacionId,
          }),
        });

        const data: RespuestaEliminar = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || 'No se pudo eliminar la evaluación de Google Drive.'
          );
        }

        await recargar();

        return data;
      } catch (e) {
        console.error('Error eliminando evaluación de Google Drive:', e);
        throw e;
      }
    },
    [recargar]
  );

  return {
    evaluaciones,
    cargado,
    error,
    recargar,
    eliminar,
  };
}