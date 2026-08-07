export interface CompetenciaData {
  competenciaTexto: string;
  capacidadesTexto: string;
  criterioTexto: string;
  indicadores: string[];
}

export const CONTENIDO_OFICIAL: Record<string, CompetenciaData> = {
  // ==========================================
  // ÁREA: COMUNICACIÓN
  // ==========================================
  COM_COMUNICA: {
    competenciaTexto:
      'SE COMUNICA ORALMENTE EN SU LENGUA MATERNA. Se comunica oralmente mediante diversos tipos de textos; identifica información explícita; realiza inferencias sencillas a partir de esta información e interpreta recursos no verbales y paraverbales de las personas de su entorno. Opina sobre lo que más/menos le gustó del contenido del texto.',
    capacidadesTexto:
      'Obtiene información del texto oral.\nInfiere e interpreta información del texto oral.\nAdecúa, organiza y desarrolla el texto de forma coherente y cohesionada.\nUtiliza recursos no verbales y paraverbales de forma estratégica.\nInteractúa estratégicamente con distintos interlocutores.\nReflexiona y evalúa la forma, el contenido y contexto del texto oral.',
    criterioTexto:
      'Participa en conversaciones o diálogos sobre los sonidos o música que descubre, o sobre las historias que escucha, manteniéndose por lo general en el tema. Recupera información explícita sobre el contenido de un texto y vuelve a contar con sus propias palabras utilizando vocabulario de uso frecuente y pronunciación entendible.',
    indicadores: [
      'Expresa sus necesidades, emociones e intereses al interactuar con personas de su entorno familiar o escolar.',
      'Participa en conversaciones o escucha cuentos y leyendas formulando preguntas o respondiendo a lo que le preguntan.',
      'Recupera información explícita de un texto oral mencionando nombres de personas o personajes.',
      'Deduce características de personas, personajes, animales y objetos en anécdotas o cuentos.',
      'Comenta lo que le gusta o le disgusta de personajes, hechos o situaciones de la vida cotidiana.',
    ],
  },
  COM_LEE: {
    competenciaTexto:
      'LEE DIVERSOS TIPOS DE TEXTOS EN SU LENGUA MATERNA. Lee diversos tipos de textos que tratan temas reales o imaginarios que le son cotidianos, en los que predominan palabras conocidas y que se acompañan con ilustraciones. Construye hipótesis o predicciones sobre la información contenida en los textos.',
    capacidadesTexto:
      'Obtiene información del texto escrito.\nInfiere e interpreta información del texto escrito.\nReflexiona y evalúa la forma, el contenido y contexto del texto escrito.',
    criterioTexto:
      'Observa con atención imágenes y gráficos en cuentos e historias identificando información explícita. Deduce e interpreta lo que observa según sus saberes previos, dando su opinión sobre lo que más le gustó de la historia.',
    indicadores: [
      'Identifica características de personas, personajes, animales u objetos a partir de lo que observa en las ilustraciones.',
      'Dice de qué tratará, cómo continuará o cómo terminará el texto a partir de las ilustraciones o imágenes.',
      'Comenta las emociones que le generó el texto leído a partir de sus intereses y experiencias.',
      'Identifica información en textos escritos como etiquetas o empaques de alimentos a partir de indicios.',
      'Da su opinión acerca de los textos observados de acuerdo a sus saberes previos.',
    ],
  },
  COM_CREA: {
    competenciaTexto:
      'CREA PROYECTOS DESDE LOS LENGUAJES ARTÍSTICOS. Crea proyectos artísticos al experimentar y manipular libremente diversos medios y materiales para descubrir sus propiedades expresivas. Explora los elementos básicos de los lenguajes del arte como el sonido, los colores y el movimiento.',
    capacidadesTexto:
      'Explora y experimenta los lenguajes del arte.\nAplica procesos creativos.\nSocializa sus procesos y proyectos.',
    criterioTexto:
      'Explora diversos materiales, los selecciona y organiza para desarrollar una propuesta artística que le permita comunicar sus vivencias personales y compartir su creación espontáneamente.',
    indicadores: [
      'Explora por iniciativa propia diversos materiales descubriendo sus posibilidades expresivas.',
      'Representa sus ideas acerca de sus vivencias personales usando lenguajes artísticos (dibujo, pintura, danza, etc.).',
      'Muestra y comenta de forma espontánea a sus compañeros y adultos lo que ha realizado al crear.',
      'Selecciona y transforma materiales de su contexto para elaborar una presentación artística.',
      'Explora y comenta sobre los sonidos que descubre y los combina transformándolos en música.',
    ],
  },

  // ==========================================
  // ÁREA: MATEMÁTICA
  // ==========================================
  MAT_CANTIDAD: {
    competenciaTexto:
      'RESUELVE PROBLEMAS DE CANTIDAD. Resuelve problemas referidos a relacionar objetos de su entorno según sus características perceptuales; agrupar, ordenar hasta el quinto lugar, seriar hasta 5 objetos, comparar cantidades y pesos, realizando representaciones con su cuerpo, material concreto o dibujos.',
    capacidadesTexto:
      'Traduce cantidades a expresiones numéricas.\nComunica su comprensión sobre los números y las operaciones.\nUsa estrategias y procedimientos de estimación y cálculo.',
    criterioTexto:
      'Compara y agrupa productos u objetos de acuerdo a sus características perceptuales, y usa el conteo espontáneo como estrategia para saber la cantidad de elementos que agrupó.',
    indicadores: [
      'Establece relaciones entre objetos comparando y agrupando aquellos que le sirven para un fin.',
      'Usa expresiones cotidianas que muestran su comprensión de cantidad y peso ("muchos", "pocos", "pesa mucho").',
      'Utiliza el conteo espontáneo en situaciones cotidianas siguiendo un orden no convencional.',
      'Ordena productos u objetos por tamaño, longitud o grosor u otro criterio.',
      'Representa agrupaciones de objetos mediante dibujos o material concreto.',
    ],
  },
  MAT_MOVIMIENTO: {
    competenciaTexto:
      'RESUELVE PROBLEMAS DE FORMA, MOVIMIENTO Y LOCALIZACIÓN. Resuelve problemas al relacionar los objetos del entorno con formas bidimensionales y tridimensionales. Expresa la ubicación de personas en relación a objetos en el espacio ("cerca de", "lejos de", "al lado de") y desplazamientos.',
    capacidadesTexto:
      'Modela objetos con formas geométricas y sus transformaciones.\nComunica su comprensión sobre las formas y relaciones geométricas.\nUsa estrategias y procedimientos para orientarse en el espacio.',
    criterioTexto:
      'Emplea diferentes estrategias al realizar desplazamientos en el espacio en situaciones de juego. Utiliza expresiones como "cerca", "lejos", "hacia adelante" o "hacia atrás" al describir sus desplazamientos y la ubicación de los objetos.',
    indicadores: [
      'Establece relaciones de medida expresando con su cuerpo cuando algo es grande o pequeño.',
      'Se ubica a sí mismo y ubica objetos en el espacio utilizando nociones como "arriba", "abajo", "dentro" y "fuera".',
      'Prueba diferentes formas de resolver situaciones de ubicación y desplazamiento en el espacio.',
      'Representa a través de un dibujo la ubicación y distribución de objetos en un espacio.',
      'Describe sus movimientos y recorridos utilizando palabras, gestos o representaciones gráficas.',
    ],
  },

  // ==========================================
  // ÁREA: PERSONAL SOCIAL
  // ==========================================
  PS_IDENTIDAD: {
    competenciaTexto:
      'CONSTRUYE SU IDENTIDAD. Construye su identidad al tomar conciencia de los aspectos que lo hacen único. Se identifica en algunas de sus características físicas, cualidades e intereses. Actúa de manera autónoma en las actividades que realiza. Expresa sus emociones e identifica el motivo que las originan.',
    capacidadesTexto:
      'Se valora a sí mismo.\nAutorregula sus emociones.',
    criterioTexto:
      'Reconoce sus características físicas, necesidades e intereses diferenciándose de otros, expresando de forma autónoma sus emociones mediante gestos o palabras e identificando lo que las origina.',
    indicadores: [
      'Reconoce sus necesidades, sensaciones, intereses y preferencias a través de palabras, gestos o acciones.',
      'Se reconoce como miembro de su familia y grupo de aula identificando a sus integrantes.',
      'Toma la iniciativa para realizar actividades cotidianas, juego y hábitos de cuidado personal e higiene.',
      'Expresa sus emociones e identifica las emociones que observa en los demás.',
      'Busca la compañía y consuelo del adulto en situaciones en las que se siente vulnerable o inseguro.',
    ],
  },
  PS_CONVIVE: {
    competenciaTexto:
      'CONVIVE Y PARTICIPA DEMOCRÁTICAMENTE EN LA BÚSQUEDA DEL BIEN COMÚN. Convive y participa democráticamente cuando interactúa de manera respetuosa con sus compañeros, cumple con sus deberes y se interesa por conocer las costumbres de su entorno. Participa y propone acuerdos y normas de convivencia.',
    capacidadesTexto:
      'Interactúa con todas las personas.\nConstruye normas, y asume acuerdos y leyes.\nParticipa en acciones que promueven el bienestar común.',
    criterioTexto:
      'Interactúa de manera respetuosa con sus compañeros en actividades grupales, establece y respeta las normas de convivencia y colabora en el cuidado de los recursos y espacios compartidos.',
    indicadores: [
      'Se relaciona con adultos y niños de su entorno en diferentes actividades del aula y juegos grupales.',
      'Participa en actividades grupales poniendo en práctica las normas de convivencia y límites conocidos.',
      'Colabora en el cuidado y uso de recursos, materiales y espacios compartidos.',
      'Realiza acciones orientadas al cuidado del entorno y establece acuerdos con sus compañeros o familia.',
      'Propone y respeta acuerdos para el buen uso del material de trabajo.',
    ],
  },

  // ==========================================
  // ÁREA: PSICOMOTRICIDAD
  // ==========================================
  PSI_MOTRICIDAD: {
    competenciaTexto:
      'SE DESENVUELVE DE MANERA AUTÓNOMA A TRAVÉS DE SU MOTRICIDAD. Se desenvuelve de manera autónoma cuando explora y descubre su lado dominante y sus posibilidades de movimiento. Realiza acciones motrices básicas en las que coordina movimientos para desplazarse con seguridad y utiliza objetos con precisión.',
    capacidadesTexto:
      'Comprende su cuerpo.\nSe expresa corporalmente.',
    criterioTexto:
      'Realiza acciones y movimientos coordinados de manera autónoma como lanzar, correr o saltar, regulando su fuerza, velocidad y equilibrio al explorar las posibilidades de su cuerpo en relación al espacio y objetos.',
    indicadores: [
      'Realiza acciones y juegos de manera autónoma (correr, saltar, trepar, rodar, lanzar pelotas).',
      'Realiza movimientos de coordinación óculo-manual y óculo-podal al manipular diferentes objetos.',
      'Reconoce sus sensaciones corporales e identifica cambios en su cuerpo (respiración, sudoración).',
      'Reconoce las partes de su cuerpo nombrándolas espontáneamente en situaciones cotidianas.',
      'Representa su cuerpo a su manera utilizando diferentes materiales gráficos o moldeables.',
    ],
  },

  // ==========================================
  // ÁREA: CIENCIA Y TECNOLOGÍA
  // ==========================================
  CT_INDAGA: {
    competenciaTexto:
      'INDAGA MEDIANTE MÉTODOS CIENTÍFICOS PARA CONSTRUIR SUS CONOCIMIENTOS. Explora los objetos, el espacio y hechos que acontecen en su entorno, hace preguntas con base en su curiosidad, propone posibles respuestas, obtiene información al observar, manipular y describir; compara aspectos para comprobar su respuesta.',
    capacidadesTexto:
      'Problematiza situaciones para hacer indagación.\nDiseña estrategias para hacer indagación.\nGenera y registra datos o información.\nAnaliza datos e información.\nEvalúa y comunica el proceso y resultado de su indagación.',
    criterioTexto:
      'Explora los espacios públicos o elementos de su comunidad, obtiene información sobre lo que observa registrándola en formatos variados y explica los hallazgos planteando hipótesis sobre sus causas y posibles soluciones.',
    indicadores: [
      'Hace preguntas que expresan su curiosidad sobre los objetos, seres vivos o hechos de su ambiente.',
      'Obtiene información sobre características de los objetos a través de sus sentidos usando herramientas sencillas.',
      'Comunica los descubrimientos que hace mediante gestos, señas, movimientos o de forma oral.',
      'Explora el entorno registrando información en fotos, dibujos o videos.',
      'Plantea hipótesis sencillas y propone ideas para cuidar la naturaleza y su entorno.',
    ],
  },
};