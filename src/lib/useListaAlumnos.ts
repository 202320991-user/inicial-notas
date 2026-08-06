import { useEffect, useState } from 'react';
import { Alumno } from '@/types';
import { cargarListaAlumnos, guardarListaAlumnos, crearId } from '@/lib/roster';

export function useListaAlumnos() {
  const [listaAlumnos, setListaAlumnos] = useState<Alumno[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setListaAlumnos(cargarListaAlumnos());
    setCargado(true);
  }, []);

  const agregarAlumno = (nombre: string, dni?: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    const nueva = [...listaAlumnos, { id: crearId('al'), nombre: limpio, dni: dni?.trim() || undefined }];
    setListaAlumnos(nueva);
    guardarListaAlumnos(nueva);
  };

  const renombrarAlumno = (id: string, nombre: string, dni?: string) => {
    const nueva = listaAlumnos.map((a) =>
      a.id === id ? { ...a, nombre: nombre.trim(), dni: dni?.trim() || undefined } : a
    );
    setListaAlumnos(nueva);
    guardarListaAlumnos(nueva);
  };

  const actualizarDniAlumno = (id: string, dni: string) => {
    const nueva = listaAlumnos.map((a) => (a.id === id ? { ...a, dni: dni.trim() || undefined } : a));
    setListaAlumnos(nueva);
    guardarListaAlumnos(nueva);
  };

  const eliminarAlumno = (id: string) => {
    const nueva = listaAlumnos.filter((a) => a.id !== id);
    setListaAlumnos(nueva);
    guardarListaAlumnos(nueva);
  };

  return { listaAlumnos, cargado, agregarAlumno, renombrarAlumno, actualizarDniAlumno, eliminarAlumno };
}