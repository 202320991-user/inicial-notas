import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  EstructuraPlantilla,
  MoldeGuardado,
  RegistroAlumno,
} from '@/types';
import { MAX_NINOS } from '@/lib/competencias';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';

/**
 * Columnas reservadas para los 5 niños.
 *
 * D = Niño 1
 * E = Niño 2
 * F = Niño 3
 * G = Niño 4
 * H = Niño 5
 */
const COLUMNAS_NINOS = ['D', 'E', 'F', 'G', 'H'];

/**
 * Borde fino reutilizable.
 */
const BORDE_FINO: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

/**
 * Convierte cualquier valor de una celda a texto simple.
 */
function obtenerTextoCelda(cell: ExcelJS.Cell): string {
  const value = cell.value;

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'richText' in value
  ) {
    const richText = (value as ExcelJS.CellRichTextValue).richText;

    return richText.map((parte) => parte.text).join('');
  }

  return String(value);
}

/**
 * Busca una fila cuyo contenido en la columna A
 * contenga determinado texto.
 */
function buscarFilaPorTexto(
  ws: ExcelJS.Worksheet,
  texto: string
): number {
  const buscado = texto.trim().toLowerCase();

  for (let fila = 1; fila <= ws.rowCount; fila++) {
    const contenido = obtenerTextoCelda(
      ws.getCell(`A${fila}`)
    )
      .trim()
      .toLowerCase();

    if (contenido.includes(buscado)) {
      return fila;
    }
  }

  return -1;
}

/**
 * Busca la fila de la leyenda.
 */
function encontrarFilaLeyenda(
  ws: ExcelJS.Worksheet
): number {
  const fila = buscarFilaPorTexto(ws, 'leyenda');

  if (fila === -1) {
    throw new Error(
      'No se encontró la fila de Leyenda en la plantilla Excel.'
    );
  }

  return fila;
}

/**
 * Busca la fila que contiene:
 * "Registro descriptivo"
 */
function encontrarFilaRegistroDescriptivo(
  ws: ExcelJS.Worksheet
): number {
  const fila = buscarFilaPorTexto(
    ws,
    'registro descriptivo'
  );

  if (fila === -1) {
    throw new Error(
      'No se encontró la sección "Registro descriptivo" en la plantilla Excel.'
    );
  }

  return fila;
}

/**
 * Busca la fila de encabezados:
 *
 * Niño | Nivel | Observación
 */
function encontrarFilaEncabezadoRegistro(
  ws: ExcelJS.Worksheet,
  registroDescRow: number
): number {
  for (
    let fila = registroDescRow + 1;
    fila <= Math.min(ws.rowCount, registroDescRow + 5);
    fila++
  ) {
    const textoA = obtenerTextoCelda(
      ws.getCell(`A${fila}`)
    )
      .trim()
      .toLowerCase();

    const textoB = obtenerTextoCelda(
      ws.getCell(`B${fila}`)
    )
      .trim()
      .toLowerCase();

    const textoC = obtenerTextoCelda(
      ws.getCell(`C${fila}`)
    )
      .trim()
      .toLowerCase();

    if (
      textoA.includes('niño') ||
      textoA.includes('nino')
    ) {
      return fila;
    }

    if (
      textoB.includes('nivel') &&
      textoC.includes('observ')
    ) {
      return fila;
    }
  }

  return registroDescRow + 1;
}

/**
 * Convierte YYYY-MM-DD → DD/MM/YYYY.
 */
function formatearFecha(fecha: string): string {
  if (!fecha) return '';

  const partes = fecha.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
}

/**
 * Limpia caracteres problemáticos para nombres de archivo.
 */
function limpiarNombreArchivo(
  texto: string
): string {
  return texto
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_');
}

/**
 * Asegura que L / EP / I queden centrados.
 */
function estilizarCalificacion(
  cell: ExcelJS.Cell
) {
  cell.alignment = {
    ...cell.alignment,
    horizontal: 'center',
    vertical: 'middle',
    wrapText: false,
    shrinkToFit: true,
  };

  cell.font = {
    ...cell.font,
    bold: cell.font?.bold ?? false,
  };
}

/**
 * Aplica bordes a una fila.
 */
function aplicarBordesFila(
  ws: ExcelJS.Worksheet,
  fila: number,
  columnas: string[]
) {
  columnas.forEach((col) => {
    ws.getCell(`${col}${fila}`).border =
      BORDE_FINO;
  });
}

/**
 * Desplaza un rango combinado hacia abajo cuando se insertan filas.
 */
function desplazarRangoCombinado(
  rango: string,
  desdeFila: number,
  cantidad: number
): string {
  const match = rango.match(
    /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/
  );

  if (!match) return rango;

  const [, colInicio, filaInicioTexto, colFin, filaFinTexto] =
    match;

  let filaInicio = Number(filaInicioTexto);
  let filaFin = Number(filaFinTexto);

  if (filaInicio >= desdeFila) {
    filaInicio += cantidad;
    filaFin += cantidad;
  } else if (filaFin >= desdeFila) {
    filaFin += cantidad;
  }

  return `${colInicio}${filaInicio}:${colFin}${filaFin}`;
}

/**
 * Copia el aspecto de una fila de indicador base a una fila nueva.
 *
 * Las filas de indicadores usan A:C como una celda combinada,
 * y D:H para las calificaciones de los niños.
 */
function copiarEstiloFilaIndicador(
  ws: ExcelJS.Worksheet,
  filaOrigen: number,
  filaDestino: number
) {
  const origen = ws.getRow(filaOrigen);
  const destino = ws.getRow(filaDestino);

  destino.height = origen.height;

  for (let columna = 1; columna <= 8; columna++) {
    const source = origen.getCell(columna);
    const target = destino.getCell(columna);

    target.style = {
      ...source.style,
    };
  }

  // Cada indicador ocupa A:C.
  try {
    ws.mergeCells(`A${filaDestino}:C${filaDestino}`);
  } catch {
    // Si ya estuviera combinado por herencia de la plantilla,
    // no necesitamos hacer nada adicional.
  }

  aplicarBordesFila(
    ws,
    filaDestino,
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  );
}

/**
 * Amplía físicamente la plantilla Excel cuando hay más indicadores
 * que filas disponibles en el archivo base.
 *
 * Inserta las filas ANTES de Leyenda, desplaza las secciones inferiores
 * y conserva sus rangos combinados.
 */
function ampliarFilasIndicadores(
  ws: ExcelJS.Worksheet,
  indicatorStartRow: number,
  legendRowOriginal: number,
  cantidadIndicadores: number
): number {
  const filasBase = Math.max(
    0,
    legendRowOriginal - indicatorStartRow
  );

  const filasExtra = Math.max(
    0,
    cantidadIndicadores - filasBase
  );

  if (filasExtra === 0) {
    return legendRowOriginal;
  }

  const filaModelo = Math.max(
    indicatorStartRow,
    legendRowOriginal - 1
  );

  // Guardamos los merges desde Leyenda hacia abajo porque algunas
  // versiones de ExcelJS no los desplazan de forma totalmente fiable.
  const mergesOriginales = [
    ...(ws.model.merges || []),
  ];

  const mergesInferiores = mergesOriginales.filter((rango) => {
    const match = rango.match(
      /^[A-Z]+(\d+):[A-Z]+(\d+)$/
    );

    if (!match) return false;

    const filaInicio = Number(match[1]);
    const filaFin = Number(match[2]);

    return (
      filaInicio >= legendRowOriginal ||
      filaFin >= legendRowOriginal
    );
  });

  mergesInferiores.forEach((rango) => {
    try {
      ws.unMergeCells(rango);
    } catch {
      // Continuamos: el rango puede haber sido alterado internamente
      // por una plantilla concreta.
    }
  });

  // Insertamos todas las filas nuevas antes de Leyenda.
  ws.insertRows(
    legendRowOriginal,
    Array.from({ length: filasExtra }, () => []),
    'i'
  );

  // Restauramos los merges inferiores ya desplazados.
  mergesInferiores.forEach((rango) => {
    const desplazado = desplazarRangoCombinado(
      rango,
      legendRowOriginal,
      filasExtra
    );

    try {
      ws.mergeCells(desplazado);
    } catch {
      // Evita que una combinación atípica de una plantilla impida
      // generar toda la ficha.
    }
  });

  // Convertimos las filas insertadas en filas de indicador reales.
  for (let i = 0; i < filasExtra; i++) {
    copiarEstiloFilaIndicador(
      ws,
      filaModelo,
      legendRowOriginal + i
    );
  }

  return legendRowOriginal + filasExtra;
}

/**
 * Devuelve estructura general para compatibilidad con la app.
 */
export async function leerEstructuraPlantilla(
  competenciaId: string
): Promise<EstructuraPlantilla> {
  const oficial =
    CONTENIDO_OFICIAL[competenciaId];

  const indicadoresDefault =
    oficial?.indicadores || [];

  return {
    competenciaTexto:
      oficial?.competenciaTexto || '',

    capacidadesTexto:
      oficial?.capacidadesTexto || '',

    criterioDefault:
      oficial?.criterioTexto || '',

    indicadoresDefault,

    indicatorStartRow: 8,

    legendRow:
      8 + indicadoresDefault.length,

    registroDescRow:
      10 + indicadoresDefault.length,

    headerNinoRow:
      11 + indicadoresDefault.length,

    dataStartRow:
      12 + indicadoresDefault.length,

    maxRow: 20,

    maxNinos: MAX_NINOS,
  };
}

/**
 * Genera la ficha usando la plantilla Excel original.
 */
async function crearWorkbookEvaluacion(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<ExcelJS.Workbook> {
  if (!archivoNombre) {
    throw new Error(
      'No se especificó una plantilla Excel.'
    );
  }

  /**
   * --------------------------------------------------
   * 1. CARGAR LA PLANTILLA ORIGINAL
   * --------------------------------------------------
   */

  const ruta =
    `/plantillas/${archivoNombre}`;

  const response = await fetch(ruta, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar "${archivoNombre}". Verifica que exista dentro de public/plantillas/.`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.load(arrayBuffer);

  const ws =
    workbook.worksheets[0];

  if (!ws) {
    throw new Error(
      `El archivo "${archivoNombre}" no contiene ninguna hoja.`
    );
  }

  /**
   * --------------------------------------------------
   * 2. OBTENER INFORMACIÓN
   * --------------------------------------------------
   */

  const oficial =
    CONTENIDO_OFICIAL[
      molde.competenciaId
    ];

  if (!oficial) {
    throw new Error(
      `No existen datos oficiales para "${molde.competenciaId}".`
    );
  }

  const ninos =
    registros.slice(0, MAX_NINOS);

  const itemsOriginales =
    molde.items &&
    molde.items.length > 0
      ? molde.items
      : oficial.indicadores || [];

  /**
   * Solo exportamos indicadores que realmente tienen texto.
   *
   * Conservamos el índice original para leer la calificación
   * correcta de cada niño aunque existan indicadores vacíos
   * entre otros indicadores completados.
   */
  const indicadoresParaExcel =
    itemsOriginales
      .map((texto, indiceOriginal) => ({
        texto,
        indiceOriginal,
      }))
      .filter(
        ({ texto }) =>
          typeof texto === 'string' &&
          texto.trim() !== ''
      );

  /**
   * --------------------------------------------------
   * 3. DETECTAR ESTRUCTURA DE LA PLANTILLA
   * --------------------------------------------------
   */

  const indicatorStartRow = 8;

  const legendRowOriginal =
    encontrarFilaLeyenda(ws);

  /**
   * Si el docente creó más indicadores que los que caben
   * originalmente en la plantilla, ampliamos el Excel antes
   * de calcular las posiciones de las secciones inferiores.
   */
  ampliarFilasIndicadores(
    ws,
    indicatorStartRow,
    legendRowOriginal,
    indicadoresParaExcel.length
  );

  // Volvemos a detectar las posiciones después de cualquier inserción.
  const legendRow =
    encontrarFilaLeyenda(ws);

  const indicatorEndRow =
    legendRow - 1;

  const totalFilasIndicadores =
    Math.max(
      0,
      indicatorEndRow -
        indicatorStartRow +
        1
    );

  const registroDescRow =
    encontrarFilaRegistroDescriptivo(ws);

  const headerNinoRow =
    encontrarFilaEncabezadoRegistro(
      ws,
      registroDescRow
    );

  const dataStartRow =
    headerNinoRow + 1;

  /**
   * --------------------------------------------------
   * 4. ACTIVIDAD / UNIDAD / FECHA
   * --------------------------------------------------
   */

  ws.getCell('A2').value =
    `ACTIVIDAD: ${molde.actividad || ''}`;

  ws.getCell('A3').value =
    `UNIDAD: ${molde.unidad || ''}`;

  ws.getCell('A4').value =
    `FECHA: ${formatearFecha(
      molde.fecha || ''
    )}`;

  /**
   * --------------------------------------------------
   * 5. COMPETENCIA / CAPACIDADES / CRITERIO
   * --------------------------------------------------
   */

  ws.getCell('A6').value =
    oficial.competenciaTexto || '';

  ws.getCell('D6').value =
    molde.capacidadesTexto?.trim()
      ? molde.capacidadesTexto
      : oficial.capacidadesTexto ||
        '';

  ws.getCell('F6').value =
    molde.criterio?.trim()
      ? molde.criterio
      : oficial.criterioTexto || '';

  ['A6', 'D6', 'F6'].forEach(
    (ref) => {
      const cell =
        ws.getCell(ref);

      cell.alignment = {
        ...cell.alignment,
        vertical: 'top',
        horizontal: 'left',
        wrapText: true,
      };
    }
  );

  /**
   * --------------------------------------------------
   * 6. NOMBRES DE LOS NIÑOS
   * --------------------------------------------------
   */

  let longitudNombreMasLargo = 0;

  COLUMNAS_NINOS.forEach(
    (col, idx) => {
      const nombre =
        ninos[idx]?.nombre?.trim() ||
        '';

      longitudNombreMasLargo =
        Math.max(
          longitudNombreMasLargo,
          nombre.length
        );

      const cell =
        ws.getCell(`${col}7`);

      cell.value = nombre;

      cell.alignment = {
        ...cell.alignment,
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
        shrinkToFit: true,
      };

      /**
       * Reducimos un poco la fuente para permitir
       * nombres completos.
       */
      cell.font = {
        ...cell.font,
        bold: true,
        size: 8,
      };
    }
  );

  /**
   * Ensanchar un poco las columnas de los niños.
   */
  COLUMNAS_NINOS.forEach((col) => {
    const columna =
      ws.getColumn(col);

    if (
      !columna.width ||
      columna.width < 14
    ) {
      columna.width = 14;
    }
  });

  /**
   * Ajustar la altura de la fila 7 según
   * la longitud del nombre más largo.
   */
  const filaNombres =
    ws.getRow(7);

  if (longitudNombreMasLargo <= 15) {
    filaNombres.height = 22;
  } else if (
    longitudNombreMasLargo <= 30
  ) {
    filaNombres.height = 32;
  } else if (
    longitudNombreMasLargo <= 45
  ) {
    filaNombres.height = 42;
  } else {
    filaNombres.height = 52;
  }

  /**
   * --------------------------------------------------
   * 7. LIMPIAR LA MATRIZ
   * --------------------------------------------------
   */

  for (
    let fila = indicatorStartRow;
    fila <= indicatorEndRow;
    fila++
  ) {
    ws.getCell(
      `A${fila}`
    ).value = '';

    COLUMNAS_NINOS.forEach(
      (col) => {
        ws.getCell(
          `${col}${fila}`
        ).value = '';
      }
    );
  }

  /**
   * --------------------------------------------------
   * 8. INDICADORES + CALIFICACIONES
   * --------------------------------------------------
   */

  for (
    let i = 0;
    i < totalFilasIndicadores;
    i++
  ) {
    const fila =
      indicatorStartRow + i;

    const indicadorCell =
      ws.getCell(
        `A${fila}`
      );

    const indicador =
      indicadoresParaExcel[i];

    indicadorCell.value =
      indicador?.texto?.trim() || '';

    indicadorCell.alignment = {
      ...indicadorCell.alignment,
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    COLUMNAS_NINOS.forEach(
      (col, idx) => {
        const nino =
          ninos[idx];

        const indiceCalificacion =
          indicador?.indiceOriginal;

        const valor =
          indiceCalificacion !== undefined
            ? nino?.calificaciones?.[
                indiceCalificacion
              ] || ''
            : '';

        const cell =
          ws.getCell(
            `${col}${fila}`
          );

        cell.value = valor;

        /**
         * Todas las L / EP / I quedan idénticas.
         */
        estilizarCalificacion(cell);
      }
    );
  }

  /**
   * --------------------------------------------------
   * 9. LIMPIAR REGISTRO DESCRIPTIVO
   * --------------------------------------------------
   */

  for (
    let i = 0;
    i < MAX_NINOS;
    i++
  ) {
    const fila =
      dataStartRow + i;

    ws.getCell(
      `A${fila}`
    ).value = '';

    ws.getCell(
      `B${fila}`
    ).value = '';

    ws.getCell(
      `C${fila}`
    ).value = '';
  }

  /**
   * --------------------------------------------------
   * 10. ENCABEZADO DEL REGISTRO DESCRIPTIVO
   * --------------------------------------------------
   */

  aplicarBordesFila(
    ws,
    headerNinoRow,
    [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
    ]
  );

  [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
  ].forEach((col) => {
    const cell =
      ws.getCell(
        `${col}${headerNinoRow}`
      );

    cell.alignment = {
      ...cell.alignment,
      vertical: 'middle',
    };
  });

  /**
   * --------------------------------------------------
   * 11. REGISTRO DESCRIPTIVO DE LOS ALUMNOS
   * --------------------------------------------------
   */

  for (
    let idx = 0;
    idx < MAX_NINOS;
    idx++
  ) {
    const fila =
      dataStartRow + idx;

    const nino =
      ninos[idx];

    /**
     * Nombre
     */
    const nombreCell =
      ws.getCell(
        `A${fila}`
      );

    nombreCell.value =
      nino?.nombre?.trim() || '';

    nombreCell.alignment = {
      ...nombreCell.alignment,
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    /**
     * Nivel
     */
    const nivelCell =
      ws.getCell(
        `B${fila}`
      );

    nivelCell.value =
      nino?.nivelAlcanzado ||
      '';

    estilizarCalificacion(
      nivelCell
    );

    /**
     * Observación
     */
    const obsCell =
      ws.getCell(
        `C${fila}`
      );

    obsCell.value =
      nino
        ?.observacionDescriptiva
        ?.trim() || '';

    obsCell.alignment = {
      ...obsCell.alignment,
      vertical: 'top',
      horizontal: 'left',
      wrapText: true,
    };

    /**
     * Bordes completos.
     */
    aplicarBordesFila(
      ws,
      fila,
      [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
      ]
    );

    /**
     * Altura mínima.
     */
    const row =
      ws.getRow(fila);

    if (
      !row.height ||
      row.height < 24
    ) {
      row.height = 24;
    }
  }

  /**
   * --------------------------------------------------
   * 12. TÍTULO REGISTRO DESCRIPTIVO
   * --------------------------------------------------
   */

  const registroTitulo =
    ws.getCell(
      `A${registroDescRow}`
    );

  registroTitulo.alignment = {
    ...registroTitulo.alignment,
    vertical: 'middle',
    horizontal: 'left',
  };

  /**
   * --------------------------------------------------
   * 13. CONFIGURACIÓN DE IMPRESIÓN
   * --------------------------------------------------
   */

  ws.pageSetup.fitToPage =
    true;

  ws.pageSetup.fitToWidth =
    1;

  ws.pageSetup.fitToHeight =
    0;

  return workbook;
}

/**
 * Convierte un ArrayBuffer a Base64 de forma segura.
 * Se usa para enviar el Excel generado a Google Drive.
 */
function arrayBufferABase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(
      i,
      Math.min(i + chunkSize, bytes.length)
    );

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Genera y descarga el Excel en la computadora.
 * Mantiene exactamente el mismo diseño que ya funcionaba.
 */
export async function generarExcelEvaluacion(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<void> {
  const workbook = await crearWorkbookEvaluacion(
    archivoNombre,
    molde,
    registros
  );

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const actividad =
    molde.actividad?.trim()
      ? limpiarNombreArchivo(molde.actividad)
      : molde.competenciaId;

  const fecha =
    molde.fecha?.trim()
      ? molde.fecha
      : 'sin_fecha';

  saveAs(
    blob,
    `Ficha_${actividad}_${fecha}.xlsx`
  );
}

/**
 * Genera el mismo Excel pero NO lo descarga.
 * Devuelve su contenido en Base64 para enviarlo a Google Drive.
 */
export async function generarExcelBase64(
  archivoNombre: string,
  molde: MoldeGuardado,
  registros: RegistroAlumno[] = []
): Promise<string> {
  const workbook = await crearWorkbookEvaluacion(
    archivoNombre,
    molde,
    registros
  );

  const buffer = await workbook.xlsx.writeBuffer();

  return arrayBufferABase64(buffer);
}