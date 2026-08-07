'use client';

import { useEffect, useState } from 'react';

/**
 * Mantiene el evaluacionId sincronizado entre la navegación por URL y sessionStorage,
 * para que no se "pierda" si algún link interno (editar, vista previa, evaluar, etc.)
 * no lo propaga en el query string.
 *
 * - Si viene un evaluacionId en la URL, se guarda en sessionStorage y se usa ese.
 * - Si NO viene en la URL, se intenta recuperar el último guardado para esa competencia.
 */
export function useEvaluacionIdPersistente(
  competenciaId: string,
  evaluacionIdDeUrl?: string
) {
  const [evaluacionId, setEvaluacionId] = useState<string | undefined>(evaluacionIdDeUrl);

  useEffect(() => {
    const clave = `evaluacionId_${competenciaId}`;

    if (evaluacionIdDeUrl) {
      sessionStorage.setItem(clave, evaluacionIdDeUrl);
      setEvaluacionId(evaluacionIdDeUrl);
    } else {
      const idGuardado = sessionStorage.getItem(clave);
      if (idGuardado) {
        setEvaluacionId(idGuardado);
      } else {
        setEvaluacionId(undefined);
      }
    }
  }, [evaluacionIdDeUrl, competenciaId]);

  return evaluacionId;
}