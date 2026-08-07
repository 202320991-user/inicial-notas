import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EstructuraPlantilla, MoldeGuardado, RegistroAlumno, Nivel } from '@/types';
import { MAX_NINOS } from '@/lib/competencias';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';

// Columnas D,E,F,G,H reservadas para hasta 5 niños en la matriz de indicadores
const COLUMNAS_NINOS = ['D', 'E', 'F', 'G', 'H'];

/**
 * Devuelve una estructura simulada basada en CONTENIDO_OFICIAL para compatibilidad.
 */
export async function leerEstructuraPlantilla(competenciaId: string): Promise<EstructuraPlantilla> {
  const oficial = CONTENIDO_OFICIAL[competenciaId];
  const indicadoresDefault = oficial?.indicadores || [];

  return {
    competenciaTexto: oficial?.competenciaTexto || '',
    capacidadesTexto: oficial?.capacidadesTexto || '',
    criterioDefault: oficial?.criterioTexto || '',
    indicadoresDefault,
    indicatorStartRow: 8,
    legendRow: 8 + indicadoresDefault.length,
    registroDescRow: 10 + indicadoresDefault.length,
    headerNinoRow: 11 + indicadoresDefault.length,
    dataStartRow: 12 + indicadoresDefault.length,
    maxRow: 20,
    maxNinos: MAX_NINOS,
  };
}

/**
 * Genera y descarga el Excel final directamente desde cero (sin depender de plantillas en public/).
 */
export async function generarExcelEvaluacion(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Evaluación');

  // Configuración de anchos de columna
  ws.getColumn('A').width = 35;
  ws.getColumn('B').width = 18;
  ws.getColumn('C').width = 40;
  ws.getColumn('D').width = 15;
  ws.getColumn('E').width = 15;
  ws.getColumn('F').width = 15;
  ws.getColumn('G').width = 15;
  ws.getColumn('H').width = 15;

  const ninos = registros.slice(0, MAX_NINOS);
  const oficial = CONTENIDO_OFICIAL[molde.competenciaId];

  // 1. Encabezados
  ws.getCell('A2').value = `ACTIVIDAD: ${molde.actividad || ''}`;
  ws.getCell('A3').value = `UNIDAD: ${molde.unidad || ''}`;
  ws.getCell('A4').value = `FECHA: ${molde.fecha || ''}`;

  // 2. Fila 5: Competencia, Capacidades y Criterio
  ws.getCell('A5').value = oficial?.competenciaTexto || '';
  ws.getCell('D5').value = molde.capacidadesTexto || oficial?.capacidadesTexto || '';
  ws.getCell('F5').value = molde.criterio || oficial?.criterioTexto || '';

  // 3. Encabezados de la matriz (Fila 7)
  ws.getCell('A7').value = 'INDICADORES DE EVALUACIÓN';
  COLUMNAS_NINOS.forEach((col, idx) => {
    ws.getCell(`${col}7`).value = ninos[idx]?.nombre || `Niño ${idx + 1}`;
  });

  // 4. Indicadores y calificaciones (a partir de la Fila 8)
  const items = molde.items && molde.items.length > 0 ? molde.items : (oficial?.indicadores || []);
  const indicatorStartRow = 8;

  items.forEach((itemText, i) => {
    const fila = indicatorStartRow + i;
    ws.getCell(`A${fila}`).value = itemText;

    COLUMNAS_NINOS.forEach((col, idx) => {
      const nino = ninos[idx];
      const valor: Nivel = nino?.calificaciones?.[i] || '';
      ws.getCell(`${col}${fila}`).value = valor;
    });
  });

  // 5. Leyenda
  const legendRow = indicatorStartRow + items.length + 1;
  ws.getCell(`A${legendRow}`).value = 'Leyenda: L = Logrado | EP = En Proceso | I = Inicio';

  // 6. Registro Descriptivo
  const registroDescRow = legendRow + 2;
  ws.getCell(`A${registroDescRow}`).value = 'REGISTRO DESCRIPTIVO';

  const headerNinoRow = registroDescRow + 1;
  ws.getCell(`A${headerNinoRow}`).value = 'Niño';
  ws.getCell(`B${headerNinoRow}`).value = 'Nivel Alcanzado';
  ws.getCell(`C${headerNinoRow}`).value = 'Observación Descriptiva';

  const dataStartRow = headerNinoRow + 1;
  for (let idx = 0; idx < MAX_NINOS; idx++) {
    const fila = dataStartRow + idx;
    const nino = ninos[idx];
    ws.getCell(`A${fila}`).value = nino?.nombre || '';
    ws.getCell(`B${fila}`).value = nino?.nivelAlcanzado || '';
    ws.getCell(`C${fila}`).value = nino?.observacionDescriptiva || '';
  }

  // Descarga del archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fechaArchivo = molde.fecha || 'evaluacion';
  saveAs(blob, `Ficha_${molde.competenciaId}_${fechaArchivo}.xlsx`);
}