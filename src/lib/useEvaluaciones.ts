import { useEffect, useState } from 'react';
import { EvaluacionGuardada } from '@/types';
import { listarEvaluaciones, eliminarEvaluacion } from './evaluaciones';

export function useEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionGuardada[]>([]);
  const [cargado, setCargado] = useState(false);

  const recargar = () => setEvaluaciones(listarEvaluaciones());

  useEffect(() => {
    recargar();
    setCargado(true);
  }, []);

  const eliminar = (id: string) => {
    eliminarEvaluacion(id);
    recargar();
  };

  return { evaluaciones, cargado, recargar, eliminar };
}