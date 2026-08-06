/**
 * Texto oficial de competencia + capacidades (CNEB, 3 años) por competencia,
 * tomado del cartel oficial. Se excluye a propósito la columna "Desempeño"
 * (el usuario pidió no usarla) y toda el área de Comunicación (excluida a pedido
 * del usuario). Donde un área tiene más de una competencia (Matemática, Personal
 * Social), cada fila del cartel se asignó a su competenciaId específico para no
 * mezclar el texto de una competencia con el de otra del mismo área.
 *
 * Si una competencia no aparece aquí (Comunicación, o cualquier otra futura),
 * el sistema sigue usando el texto que ya trae la plantilla física (comportamiento
 * original, sin cambios).
 */
/**
 * Texto oficial de competencia + capacidades (CNEB, 3 años) por competencia,
 * tomado del cartel oficial. Se excluye a propósito la columna "Desempeño".
 */

export const CONTENIDO_OFICIAL: Record<string, { competenciaTexto: string; capacidadesTexto: string; criterioTexto?: string }> = {
  COM_COMUNICA: {
    competenciaTexto:
      'Se comunica oralmente en su lengua materna. Comprende y expresa mensajes orales relacionados con la ubicación y el desplazamiento, escuchando consignas, respondiendo a preguntas y comunicando con palabras orales o gestos la posición de personas, objetos o los recorridos que realiza durante los juegos.',
    capacidadesTexto:
      'Obtiene información del texto oral. Infiere e interpreta información del texto oral. Adecúa, organiza y desarrolla el texto de forma coherente y cohesionada. Utiliza recursos no verbales y paraverbales de forma estratégica. Interactúa estratégicamente con distintos interlocutores. Reflexiona y evalúa la forma, el contenido y el contexto del texto oral.',
    criterioTexto:
      'Comprende y expresa mensajes orales relacionados con la ubicación y el desplazamiento, escuchando consignas, respondiendo a preguntas y comunicando con palabras o gestos la posición de personas, objetos o los recorridos que realiza durante los juegos.',
  },
  COM_LEE: {
    competenciaTexto:
      'Lee diversos tipos de textos escritos en su lengua materna. Lee diversos tipos de textos que tratan temas reales o imaginarios que le son cotidianos, en los que predominan palabras conocidas y que se acompañan con ilustraciones. Construye hipótesis o predicciones sobre la información contenida en los textos y demuestra comprensión de las ilustraciones y de algunos símbolos escritos que transmiten información.',
    capacidadesTexto:
      'Obtiene información del texto escrito. Infiere e interpreta información del texto escrito. Reflexiona y evalúa la forma, el contenido y el contexto del texto escrito.',
    criterioTexto:
      'Lee diversos tipos de textos identificando información en ilustraciones y prediciendo su contenido a partir de indicios cotidianos.',
  },
  COM_CREA: {
    competenciaTexto:
      'Crea proyectos desde los lenguajes artísticos. Crea proyectos artísticos al experimentar y manipular libremente diversos medios y materiales para descubrir sus propiedades expresivas. Explora los elementos básicos de los lenguajes del arte como el sonido, los colores y el movimiento. Explora sus propias ideas imaginativas que construye a partir de sus vivencias y las transforma en algo nuevo mediante el juego simbólico, el dibujo, la pintura, la construcción, la música y el movimiento creativo.',
    capacidadesTexto:
      'Explora y experimenta los lenguajes del arte. Aplica procesos creativos. Socializa sus procesos y proyectos.',
    criterioTexto:
      'Crea proyectos artísticos experimentando con diversos materiales y expresando sus ideas e imaginación a través de lenguajes plásticos o corporales.',
  },
  MAT_CANTIDAD: {
    competenciaTexto:
      'Resuelve problemas de cantidad. Resuelve problemas referidos a relacionar objetos de su entorno según sus características perceptuales; agrupar, ordenar hasta el quinto lugar, seriar hasta 5 objetos, comparar cantidades de objetos y pesos, agregar y quitar hasta 5 elementos, realizando representaciones con su cuerpo, material concreto o dibujos. Expresa la cantidad de hasta 10 objetos, usando estrategias como el conteo. Usa cuantificadores: "muchos", "pocos", "ninguno", y expresiones: "más que", "menos que". Expresa el peso de los objetos "pesa más", "pesa menos" y el tiempo con nociones temporales como "antes o después", "ayer", "hoy" o "mañana".',
    capacidadesTexto:
      'Traduce cantidades a expresiones numéricas. Comunica su comprensión sobre los números y las operaciones. Usa estrategias y procedimientos de estimación y cálculo.',
    criterioTexto:
      'Compara y agrupa los productos que colocará en la tienda, de acuerdo a sus características perceptuales, y usa el conteo como estrategia para saber la cantidad de objetos que agrupó.',
  },
  MAT_MOVIMIENTO: {
    competenciaTexto:
      'Resuelve problemas de forma, movimiento y localización. Resuelve problemas al relacionar los objetos del entorno con formas bidimensionales y tridimensionales. Expresa la ubicación de personas en relación a objetos en el espacio "cerca de", "lejos de", "al lado de", y de desplazamientos "hacia adelante, hacia atrás", "hacia un lado, hacia el otro". Así también expresa la comparación de la longitud de dos objetos: "es más largo que", "es más corto que". Emplea estrategias para resolver problemas, al construir objetos con material concreto o realizar desplazamientos en el espacio.',
    capacidadesTexto:
      'Modela objetos con formas geométricas y sus transformaciones. Comunica su comprensión sobre las formas y relaciones geométricas. Usa estrategias y procedimientos para orientarse en el espacio.',
    criterioTexto:
      'Representa, a través de un dibujo, el diseño de su tienda y la ubicación de los productos (plano) y verbaliza el lugar y la posición de los productos que irán distribuidos en la tienda, usando nociones espaciales como "cerca de", "lejos de" y "al lado de".',
  },
  PS_IDENTIDAD: {
    competenciaTexto:
      'Construye su identidad al tomar conciencia de los aspectos que lo hacen único. Se identifica en algunas de sus características físicas, así como sus cualidades e intereses, gustos y preferencias. Se siente miembro de su familia y del grupo de aula al que pertenece. Practica hábitos saludables reconociendo que son importantes para él. Actúa de manera autónoma en las actividades que realiza y es capaz de tomar decisiones, desde sus posibilidades y considerando a los demás. Expresa sus emociones e identifica el motivo que las originan. Busca y acepta la compañía de un adulto significativo ante situaciones que lo hacen sentir vulnerable, inseguro, con ira, triste o alegre.',
    capacidadesTexto: 'Se valora a sí mismo. Autorregula sus emociones.',
    criterioTexto:
      'Reconoce sus necesidades, sensaciones, intereses y preferencias; las diferencia de las de los otros a través de palabras, acciones, gestos o movimientos.',
  },
  PS_CONVIVE: {
    competenciaTexto:
      'Convive y participa democráticamente en la búsqueda del bien común cuando interactúa de manera respetuosa con sus compañeros desde su propia iniciativa, cumple con sus deberes y se interesa por conocer más sobre las diferentes costumbres y características de las personas de su entorno inmediato. Participa y propone acuerdos y normas de convivencia para el bien común. Realiza acciones con otros para el buen uso de los espacios, materiales y recursos.',
    capacidadesTexto:
      'Interactúa con todas las personas. Construye normas, y asume acuerdos y leyes. Participa en acciones que promueven el bienestar común.',
    criterioTexto:
      'Participa en juegos de orientación espacial respetando acuerdos, turnos y normas de convivencia, colaborando con sus compañeros para lograr los desafíos propuestos.',
  },
  PSI_MOTRICIDAD: {
    competenciaTexto:
      'Se desenvuelve de manera autónoma a través de su motricidad cuando explora y descubre su lado dominante y sus posibilidades de movimiento por propia iniciativa en situaciones cotidianas. Realiza acciones motrices básicas en las que coordina movimientos para desplazarse con seguridad y utilizes objetos con precisión, orientándose y regulando sus acciones en relación a estos, a las personas, el espacio y el tiempo. Expresa corporalmente sus sensaciones, emociones y sentimientos a través del tono, gesto, posturas, ritmo y movimiento en situaciones de juego.',
    capacidadesTexto: 'Comprende su cuerpo. Se expresa corporalmente.',
    criterioTexto:
      'Realiza acciones y movimientos coordinados de manera autónoma como lanzar, patear, encestar, utilizando la precisión en sus acciones y movimientos.',
  },
  CT_INDAGA: {
    competenciaTexto:
      'Indaga mediante métodos científicos para construir sus conocimientos. Explora los objetos, el espacio y hechos que acontecen en su entorno, hace preguntas con base en su curiosidad, propone posibles respuestas, obtiene información al observar, manipular y describir; compara aspectos del objeto o fenómeno para comprobar la respuesta y expresa en forma oral o gráfica lo que hizo y aprendió.',
    capacidadesTexto:
      'Problematiza situaciones para hacer indagación. Diseña estrategias para hacer indagación. Genera y registra datos o información. Analiza datos e información. Evalúa y comunica el proceso y resultado de su indagación.',
    criterioTexto:
      'Explora los espacios públicos de su comunidad y obtiene información sobre los problemas de contaminación y sobre las acciones que realizan para su cuidado, y la registra en formatos variados (fotos, videos, dibujos).',
  },
};