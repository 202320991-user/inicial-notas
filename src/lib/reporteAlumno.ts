import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Alumno, EvaluacionGuardada, Nivel } from '@/types';

function etiquetaNivel(nivel: Nivel): string {
  if (nivel === 'L') return 'Logrado';
  if (nivel === 'EP') return 'En proceso';
  if (nivel === 'I') return 'En inicio';
  return '';
}

/**
 * Genera y descarga un Excel nuevo (creado desde cero con ExcelJS, no basado en ninguna
 * plantilla física) con el historial completo de UN alumno a través de todas las áreas
 * y competencias en las que tenga evaluaciones guardadas en el Drive.
 */
export async function generarReporteAlumno(alumno: Alumno, evaluaciones: EvaluacionGuardada[]): Promise<void> {
  const filas = evaluaciones
    .map((ev) => {
      const nino = ev.ninos.find((n) => n.alumnoId === alumno.id);
      if (!nino) return null;
      return {
        fecha: ev.fecha || '',
        area: ev.areaNombre,
        competencia: ev.competenciaNombre,
        actividad: ev.tituloActividad,
        nivel: etiquetaNivel(nino.nivelAlcanzado),
        observacion: nino.observacionDescriptiva,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Historial');

  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = `Historial de evaluaciones — ${alumno.nombre}`;
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getRow(1).height = 24;

  ws.columns = [
    { key: 'fecha', width: 12 },
    { key: 'area', width: 18 },
    { key: 'competencia', width: 34 },
    { key: 'actividad', width: 28 },
    { key: 'nivel', width: 15 },
    { key: 'observacion', width: 55 },
  ];

  const encabezados = ['Fecha', 'Área', 'Competencia', 'Actividad', 'Nivel alcanzado', 'Observación descriptiva'];
  const filaEncabezado = ws.getRow(2);
  encabezados.forEach((texto, i) => {
    filaEncabezado.getCell(i + 1).value = texto;
  });
  filaEncabezado.font = { bold: true };
  filaEncabezado.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2F8' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBEC7D1' } } };
  });

  filas.forEach((fila) => {
    const fechaFormateada = fila.fecha ? fila.fecha.split('-').reverse().join('/') : '';
    const row = ws.addRow({ ...fila, fecha: fechaFormateada });
    row.getCell(6).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(3).alignment = { wrapText: true, vertical: 'top' };
  });

  if (filas.length === 0) {
    ws.addRow(['Este alumno todavía no tiene evaluaciones guardadas en el Drive.']);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Historial_${alumno.nombre.replace(/\s+/g, '_')}.xlsx`);
}