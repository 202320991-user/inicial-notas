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
 * Estilo de borde delgado reutilizable
 */
const borderThin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

/**
 * Genera y descarga el Excel final replicando el diseño oficial.
 */
export async function generarExcelEvaluacion(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('PSICO');

  // Configuración de anchos de columna (A-C adaptadas para abarcar los indicadores)
  ws.getColumn('A').width = 30;
  ws.getColumn('B').width = 25;
  ws.getColumn('C').width = 25;
  ws.getColumn('D').width = 12;
  ws.getColumn('E').width = 12;
  ws.getColumn('F').width = 12;
  ws.getColumn('G').width = 12;
  ws.getColumn('H').width = 12;

  const ninos = registros.slice(0, MAX_NINOS);
  const oficial = CONTENIDO_OFICIAL[molde.competenciaId];

  // 1. Título principal y Datos Informativos
  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = 'FICHA REGISTRO DE OBSERVACION';
  ws.getCell('A1').font = { bold: true, size: 12 };
  ws.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = `ACTIVIDAD: ${molde.actividad || ''}`;

  ws.mergeCells('A3:H3');
  ws.getCell('A3').value = `UNIDAD: ${molde.unidad || ''}`;

  ws.mergeCells('A4:H4');
  ws.getCell('A4').value = `FECHA: ${molde.fecha || ''}`;

  // 2. Fila 5: Encabezados de Competencia, Capacidades y Criterio
  ws.mergeCells('A5:C5');
  ws.getCell('A5').value = 'COMPETENCIA';
  
  ws.mergeCells('D5:E5');
  ws.getCell('D5').value = 'capacidades';

  ws.mergeCells('F5:H5');
  ws.getCell('F5').value = 'crierio de evaluacion';

  ['A5', 'D5', 'F5'].forEach(ref => {
    const cell = ws.getCell(ref);
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // 2b. Fila 6: Contenidos de Competencia, Capacidades y Criterio
  ws.mergeCells('A6:C6');
  ws.getCell('A6').value = oficial?.competenciaTexto || '';

  ws.mergeCells('D6:E6');
  ws.getCell('D6').value = molde.capacidadesTexto || oficial?.capacidadesTexto || '';

  ws.mergeCells('F6:H6');
  ws.getCell('F6').value = molde.criterio || oficial?.criterioTexto || '';

  ['A6', 'D6', 'F6'].forEach(ref => {
    const cell = ws.getCell(ref);
    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  });

  // Aplicar bordes al bloque de competencia
  ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6'].forEach(ref => {
    ws.getCell(ref).border = borderThin;
  });

  // 3. Encabezados de la matriz (Fila 7)
  ws.mergeCells('A7:C7');
  ws.getCell('A7').value = 'indicadores de evaluación';
  ws.getCell('A7').font = { bold: true };
  ws.getCell('A7').alignment = { vertical: 'middle', horizontal: 'left' };

  COLUMNAS_NINOS.forEach((col, idx) => {
    const cell = ws.getCell(`${col}7`);
    cell.value = ninos[idx]?.nombre || `Niño ${idx + 1}`;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // 4. Indicadores y calificaciones (a partir de la Fila 8)
  const items = molde.items && molde.items.length > 0 ? molde.items : (oficial?.indicadores || []);
  const indicatorStartRow = 8;

  items.forEach((itemText, i) => {
    const fila = indicatorStartRow + i;

    // Combinar A, B y C para el indicador de evaluación
    ws.mergeCells(`A${fila}:C${fila}`);
    const indCell = ws.getCell(`A${fila}`);
    indCell.value = itemText;
    indCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // Bordes para el indicador
    ['A', 'B', 'C'].forEach(col => {
      ws.getCell(`${col}${fila}`).border = borderThin;
    });

    // Calificaciones por niño (Columnas D a H)
    COLUMNAS_NINOS.forEach((col, idx) => {
      const nino = ninos[idx];
      const valor: Nivel = nino?.calificaciones?.[i] || '';
      const calCell = ws.getCell(`${col}${fila}`);
      calCell.value = valor;
      calCell.alignment = { horizontal: 'center', vertical: 'middle' };
      calCell.border = borderThin;
    });
  });

  // 5. Leyenda
  const legendRow = indicatorStartRow + items.length + 1; // Fila 16 aprox.
  ws.mergeCells(`A${legendRow}:H${legendRow}`);
  const legCell = ws.getCell(`A${legendRow}`);
  legCell.value = 'Leyenda: L = Logrado    EP = En proceso    I = Inicio';
  legCell.font = { italic: true };
  legCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // 6. Registro Descriptivo (Sección Inferior)
  const registroDescRow = legendRow + 2; // Fila 18
  ws.mergeCells(`A${registroDescRow}:H${registroDescRow}`);
  const regDescCell = ws.getCell(`A${registroDescRow}`);
  regDescCell.value = 'Registro descriptivo';
  regDescCell.font = { bold: true, size: 11 };

  const headerNinoRow = registroDescRow + 2; // Fila 20
  ws.getCell(`A${headerNinoRow}`).value = 'Niño';
  ws.getCell(`B${headerNinoRow}`).value = 'Nivel alcanzado';
  
  ws.mergeCells(`C${headerNinoRow}:H${headerNinoRow}`);
  ws.getCell(`C${headerNinoRow}`).value = 'Observación descriptiva';

  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
    const cell = ws.getCell(`${col}${headerNinoRow}`);
    cell.font = { bold: true };
    cell.border = borderThin;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const dataStartRow = headerNinoRow + 1; // Fila 21
  for (let idx = 0; idx < MAX_NINOS; idx++) {
    const fila = dataStartRow + idx;
    const nino = ninos[idx];

    ws.getCell(`A${fila}`).value = nino?.nombre || '';
    ws.getCell(`A${fila}`).border = borderThin;

    ws.getCell(`B${fila}`).value = nino?.nivelAlcanzado || '';
    ws.getCell(`B${fila}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(`B${fila}`).border = borderThin;

    // Combinar de C a H para el espacio de observación descriptiva
    ws.mergeCells(`C${fila}:H${fila}`);
    const obsCell = ws.getCell(`C${fila}`);
    obsCell.value = nino?.observacionDescriptiva || '';
    obsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

    ['C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      ws.getCell(`${col}${fila}`).border = borderThin;
    });
  }

  // Descarga del archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fechaArchivo = molde.fecha || 'evaluacion';
  saveAs(blob, `Ficha_${molde.competenciaId}_${fechaArchivo}.xlsx`);
}