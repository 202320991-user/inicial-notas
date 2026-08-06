/**
 * Presets de "unidad didáctica" (criterio + indicadores) listos para cargar en una
 * ficha con un clic, en vez de escribirlos a mano. Por pedido del usuario, NO incluye
 * Comunicación (la excluyó explícitamente) aunque el documento fuente sí traía esa área.
 *
 * Cada preset trae exactamente 5 indicadores. Si la plantilla física de esa competencia
 * tiene menos de 5 filas impresas, se aplican solo los primeros que quepan (el sistema
 * avisa cuántos se aplicaron); si tiene más de 5, las filas sobrantes quedan como estaban.
 */
export interface UnidadPredefinida {
  titulo: string;
  criterio: string;
  indicadores: string[];
}

export const UNIDADES_PREDEFINIDAS: Record<string, UnidadPredefinida> = {
  MAT_MOVIMIENTO: {
    titulo: 'Ubicación y desplazamiento',
    criterio:
      'Se desplaza y se ubica en diferentes espacios siguiendo consignas sencillas; reconoce y representa la ubicación de objetos y de sí mismo utilizando relaciones espaciales (dentro-fuera, arriba-abajo, delante-detrás, cerca-lejos), comunicando con palabras, gestos o acciones cómo realizó sus desplazamientos durante situaciones de juego y exploración.',
    indicadores: [
      'Ubica su cuerpo u objetos utilizando nociones espaciales sencillas (dentro-fuera, arriba-abajo, delante-detrás).',
      'Sigue consignas para desplazarse por diferentes espacios.',
      'Recorre caminos o circuitos sencillos orientándose con seguridad.',
      'Comunica la ubicación de personas, objetos o recorridos mediante palabras, gestos o señalamientos.',
      'Participa en juegos de orientación espacial mostrando progresiva autonomía.',
    ],
  },
  PSI_MOTRICIDAD: {
    titulo: 'Ubicación y desplazamiento',
    criterio:
      'Explora y controla progresivamente los movimientos de su cuerpo al desplazarse, mantener el equilibrio y recorrer diferentes espacios, adecuando sus acciones a las consignas y demostrando seguridad durante los juegos motores.',
    indicadores: [
      'Se desplaza con equilibrio al caminar, correr o cambiar de dirección.',
      'Ajusta sus movimientos de acuerdo con las consignas recibidas.',
      'Recorre circuitos motores superando pequeños obstáculos.',
      'Coordina sus movimientos durante juegos de desplazamiento y exploración.',
      'Participa con seguridad y autonomía en las actividades motrices.',
    ],
  },
  PS_CONVIVE: {
    titulo: 'Ubicación y desplazamiento',
    criterio:
      'Participa en juegos de orientación espacial respetando acuerdos, turnos y normas de convivencia, colaborando con sus compañeros para lograr los desafíos propuestos.',
    indicadores: [
      'Respeta las normas establecidas durante los juegos.',
      'Espera su turno para participar en los recorridos y actividades.',
      'Colabora con sus compañeros durante los juegos de orientación espacial.',
      'Cuida los materiales y espacios utilizados en las actividades.',
      'Participa activamente mostrando disposición para trabajar con el grupo.',
    ],
  },
};