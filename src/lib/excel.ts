import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EstructuraPlantilla, MoldeGuardado, RegistroAlumno, Nivel } from '@/types';
import { MAX_NINOS } from '@/lib/competencias';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';

// Columnas D,E,F,G,H reservadas para hasta 5 niños en la matriz de indicadores
const COLUMNAS_NINOS = ['D', 'E', 'F', 'G', 'H'];

function isRichTextValue(valor: ExcelJS.CellValue): valor is ExcelJS.CellRichTextValue {
  return typeof valor === 'object' && valor !== null && 'richText' in valor;
}

function textoCelda(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (isRichTextValue(valor)) {
    return valor.richText.map((r) => r.text).join('');
  }
  return String(valor);
}

async function cargarWorkbook(archivoNombre: string): Promise<ExcelJS.Workbook> {
  const response = await fetch(`/plantillas/${archivoNombre}`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la plantilla ${archivoNombre}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
}

/**
 * Devuelve la primera hoja del libro POR POSICIÓN, no por su id interno.
 *
 * BUG CORREGIDO: el código original usaba `workbook.getWorksheet(1)`, que busca la hoja
 * cuyo id interno de Excel es 1 (el id no cambia aunque se reordenen o se borren hojas).
 * Si una plantilla alguna vez tuvo una segunda hoja que luego se eliminó, su única hoja
 * restante puede haber quedado con id=2 (o cualquier otro número), y `getWorksheet(1)`
 * devuelve `undefined` aunque el archivo tenga una hoja perfectamente válida.
 * Esto es justo lo que le pasaba a CIENCIA_INDAGA.xlsx: su hoja "INDAGA" tiene id=2,
 * así que la ficha de Ciencia mostraba "No se pudo leer la plantilla" siempre.
 * `workbook.worksheets[0]` toma la primera hoja por posición, que es lo que en realidad
 * se quiere aquí.
 */
function primeraHoja(workbook: ExcelJS.Workbook, archivoNombre: string): ExcelJS.Worksheet {
  const ws = workbook.worksheets[0];
  if (!ws) throw new Error(`La plantilla ${archivoNombre} no tiene hojas`);
  return ws;
}

/**
 * Analiza la hoja de una plantilla física y detecta dinámicamente en qué filas
 * está cada sección. La estructura (fila 5 = competencia/capacidades/criterio,
 * fila 6 = encabezado de indicadores + nombres de niños, filas siguientes =
 * indicadores hasta la fila "Leyenda", luego "Registro descriptivo" y 5 filas
 * de detalle por niño) es consistente en las 9 plantillas, pero el número de
 * indicadores varía, así que no se puede asumir un número de fila fijo.
 */
function analizarHoja(ws: ExcelJS.Worksheet): EstructuraPlantilla {
  // La fila 7 contiene el encabezado "Indicadores de evaluación"; los textos
  // reales de cada indicador empiezan en la fila 8, por eso el rango útil de
  // indicadores debe arrancar en esa fila y no en la cabecera.
  const indicatorStartRow = 8;
  let legendRow = 0;
  for (let r = indicatorStartRow; r <= ws.rowCount; r++) {
    const v = textoCelda(ws.getCell(`A${r}`).value).trim().toLowerCase();
    if (v.startsWith('leyenda')) {
      legendRow = r;
      break;
    }
  }
  if (!legendRow) legendRow = indicatorStartRow; // fallback de seguridad

  let registroDescRow = 0;
  for (let r = legendRow + 1; r <= ws.rowCount; r++) {
    const v = textoCelda(ws.getCell(`A${r}`).value).toLowerCase();
    if (v.includes('registro descriptivo')) {
      registroDescRow = r;
      break;
    }
  }

  let headerNinoRow = 0;
  for (let r = registroDescRow + 1; r <= ws.rowCount; r++) {
    const v = textoCelda(ws.getCell(`A${r}`).value).trim().toLowerCase();
    if (v === 'niño') {
      headerNinoRow = r;
      break;
    }
  }

  const dataStartRow = headerNinoRow + 1;

  const indicadoresDefault: string[] = [];
  for (let r = indicatorStartRow; r < legendRow; r++) {
    const texto = textoCelda(ws.getCell(`A${r}`).value).trim();
    if (texto) indicadoresDefault.push(texto);
  }

  return {
    competenciaTexto: textoCelda(ws.getCell('A5').value),
    capacidadesTexto: textoCelda(ws.getCell('D5').value),
    criterioDefault: textoCelda(ws.getCell('F5').value),
    indicadoresDefault,
    indicatorStartRow,
    legendRow,
    registroDescRow,
    headerNinoRow,
    dataStartRow,
    maxRow: ws.rowCount,
    maxNinos: MAX_NINOS,
  };
}

/** Lee una plantilla física y devuelve su estructura + valores por defecto (para precargar el molde) */
export async function leerEstructuraPlantilla(archivoNombre: string): Promise<EstructuraPlantilla> {
  const workbook = await cargarWorkbook(archivoNombre);
  const ws = primeraHoja(workbook, archivoNombre);
  return analizarHoja(ws);
}

/**
 * Genera y descarga el Excel final: aplica el molde (actividad, unidad, fecha, criterio,
 * indicadores) y, si se proveen, los registros de niños (nombres, matriz de
 * calificación por indicador y el registro descriptivo).
 */
export async function generarExcelEvaluacion(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<void> {
  const workbook = await cargarWorkbook(archivoNombre);
  const ws = primeraHoja(workbook, archivoNombre);

  const estructura = analizarHoja(ws);
  const ninos = registros.slice(0, MAX_NINOS);

  // 1. Encabezado: actividad, unidad y fecha (conservando la etiqueta original de la celda)
  ws.getCell('A2').value = `ACTIVIDAD: ${molde.actividad || ''}`;
  ws.getCell('A3').value = `UNIDAD: ${molde.unidad || ''}`;
  ws.getCell('A4').value = `FECHA: ${molde.fecha || ''}`;

  // 2. Textos oficiales (Competencia, Capacidades) y Criterio de evaluación en la fila 5
  const oficial = CONTENIDO_OFICIAL[molde.competenciaId];
  ws.getCell('A5').value = oficial?.competenciaTexto ?? estructura.competenciaTexto;
  ws.getCell('D5').value = molde.capacidadesTexto || oficial?.capacidadesTexto || estructura.capacidadesTexto;
  ws.getCell('F5').value = molde.criterio || '';

  // 3. Indicadores de evaluación (una fila por indicador, según lo detectado en la plantilla)
  const numFilasIndicador = estructura.legendRow - estructura.indicatorStartRow;
  for (let i = 0; i < numFilasIndicador; i++) {
    const fila = estructura.indicatorStartRow + i;
    const texto = molde.items[i] ?? '';
    ws.getCell(`A${fila}`).value = texto;
  }

  // 4. Nombres de los niños en el encabezado de la matriz (fila 6, columnas D-H)
  // Se escribe SIEMPRE en las 5 columnas (incluso vacío) para borrar cualquier
  // nombre de ejemplo que la plantilla física ya trajera.
  COLUMNAS_NINOS.forEach((col, idx) => {
    ws.getCell(`${col}6`).value = ninos[idx]?.nombre || '';
  });

  // 5. Matriz de calificación: cada indicador x cada niño
  for (let i = 0; i < numFilasIndicador; i++) {
    const fila = estructura.indicatorStartRow + i;
    COLUMNAS_NINOS.forEach((col, idx) => {
      const nino = ninos[idx];
      const valor: Nivel = nino?.calificaciones?.[i] || '';
      ws.getCell(`${col}${fila}`).value = valor;
    });
  }

  // 6. Registro descriptivo: 5 filas fijas (niño / nivel alcanzado / observación)
  for (let idx = 0; idx < MAX_NINOS; idx++) {
    const fila = estructura.dataStartRow + idx;
    const nino = ninos[idx];
    ws.getCell(`A${fila}`).value = nino?.nombre || '';
    ws.getCell(`B${fila}`).value = nino?.nivelAlcanzado || '';
    ws.getCell(`C${fila}`).value = nino?.observacionDescriptiva || '';
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fechaArchivo = molde.fecha || 'editable';
  saveAs(blob, `Ficha_${molde.competenciaId}_${fechaArchivo}.xlsx`);
}