/**
 * Generador de outputs Hodon — determinístico, listo para swap a LLM.
 * Produce todas las secciones del análisis en español.
 */

export interface PaperAdjunto {
  id: string;
  titulo: string;
  abstract?: string;
  conceptos?: Array<{ display_name: string; score: number }>;
  citas?: number;
  año?: number;
  autores?: string[];
}

export interface InputSeed {
  tipo: "pregunta" | "openalex" | "pdf";
  pregunta?: string;
  papersAdjuntos?: PaperAdjunto[];
  nombreArchivo?: string;
}

export interface HodonSections {
  abstract: string;
  mapa_conceptos: {
    nucleo: string;
    nodos: string[];
    relaciones: Array<{ desde: string; hasta: string; etiqueta: string }>;
  };
  cuadrantes: {
    hechos: string[];
    inferencias: string[];
    hipotesis: string[];
    especulacion: string[];
  };
  axiomas: string[];
  supuestos_criticos: Array<{ texto: string; confianza: "alta" | "media" | "baja" }>;
  primeros_principios: string[];
  red_team: Array<{ modo_fallo: string; test_falsificacion: string }>;
  foresight: {
    drivers: string[];
    incertidumbres: string[];
    escenarios: Array<{ nombre: string; descripcion: string }>;
    señales: string[];
  };
  riesgos: Array<{ riesgo: string; mitigacion: string }>;
  recomendacion_final: {
    veredicto: "AVANZAR" | "NO AVANZAR" | "REQUIERE MÁS DATOS";
    fundamento: string;
    proximos_pasos: string[];
  };
  referencias: Array<{
    titulo: string;
    autores: string;
    año: number;
    relevancia: string;
    tipo: "paper" | "informe" | "libro" | "dataset";
  }>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[Math.abs(seed + offset) % arr.length];
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ── generator ─────────────────────────────────────────────────────────────────

export function generateOutput(seed: InputSeed): HodonSections {
  // Extraer tema principal
  const tema =
    seed.tipo === "pregunta"
      ? seed.pregunta || "Investigación científica"
      : seed.papersAdjuntos?.[0]?.titulo || seed.nombreArchivo || "Investigación";

  const primerPaper = seed.papersAdjuntos?.[0];
  const abstractFuente = primerPaper?.abstract || "";
  const citas = primerPaper?.citas;
  const año = primerPaper?.año;
  const conceptosSrc = (primerPaper?.conceptos || []).map((c) => c.display_name);
  const autoresSrc = (primerPaper?.autores || []).slice(0, 3).join(", ") || "Varios autores";

  const h = hashStr(tema);

  // Conceptos del dominio
  const conceptosBase = [
    "Metodología sistémica",
    "Análisis de evidencia",
    "Modelado causal",
    "Validación empírica",
    "Marco teórico",
    "Intervención experimental",
    "Inferencia estadística",
    "Revisión de literatura",
  ];

  const conceptos = conceptosSrc.length >= 4
    ? conceptosSrc.slice(0, 6)
    : [...conceptosSrc, ...conceptosBase.slice(0, 6 - conceptosSrc.length)];

  // Veredicto basado en citas / disponibilidad de datos
  const veredicto: "AVANZAR" | "NO AVANZAR" | "REQUIERE MÁS DATOS" =
    citas !== undefined
      ? citas > 300
        ? "AVANZAR"
        : citas < 20
        ? "REQUIERE MÁS DATOS"
        : "AVANZAR"
      : pick(["AVANZAR", "REQUIERE MÁS DATOS", "AVANZAR", "REQUIERE MÁS DATOS", "NO AVANZAR"], h);

  const añoLabel = año ? ` (${año})` : "";
  const citasLabel = citas !== undefined ? ` Respaldado por ${citas} citas en la literatura.` : "";

  // ── abstract (más profesional que one_liner) ────────────────────────────────
  const abstract = abstractFuente
    ? `Este análisis examina "${tema}"${añoLabel} a través de un marco epistémico multidimensional. ${abstractFuente.slice(0, 250)}... La evidencia disponible${citasLabel} sugiere un territorio de investigación con implicaciones directas sobre ${conceptos[0]} y ${conceptos[1]}, requiriendo síntesis rigurosa antes de cualquier decisión de asignación de recursos.`
    : `El presente análisis aborda la pregunta de investigación: "${tema}". A partir de la síntesis de evidencia disponible y razonamiento de primeros principios, se identifican los supuestos clave, los modos de fallo críticos y el estado actual del conocimiento en este dominio. El objetivo es proveer un mapa epistémico que oriente la toma de decisiones con rigor metodológico.`;

  // ── mapa de conceptos ───────────────────────────────────────────────────────
  const mapa_conceptos = {
    nucleo: tema.length > 50 ? tema.slice(0, 50) + "…" : tema,
    nodos: conceptos.slice(0, 6),
    relaciones: conceptos.slice(1, 5).map((c, i) => ({
      desde: conceptos[0],
      hasta: c,
      etiqueta: pick(["fundamenta", "condiciona", "precede a", "amplifica", "informa"], h, i),
    })),
  };

  // ── cuadrantes ──────────────────────────────────────────────────────────────
  const cuadrantes = {
    hechos: [
      `${conceptos[0]} ha sido documentado empíricamente en múltiples contextos dentro de este dominio.`,
      `La literatura existente${citasLabel ? ` (${citas} referencias)` : ""} establece ${conceptos[1]} como mecanismo central.`,
      `Los estudios publicados${añoLabel} confirman la relación entre ${conceptos[0]} y ${conceptos[2] || "los resultados observados"}.`,
      `Existe consenso metodológico respecto al uso de ${conceptos[1]} como variable de referencia.`,
    ],
    inferencias: [
      `La madurez de ${conceptos[0]} sugiere que las oportunidades de investigación original se concentran en ${conceptos[2] || "áreas adyacentes"}.`,
      `La brecha entre teoría y aplicación indica que la traslación práctica requiere al menos ${pick(["12", "18", "24", "36"], h)} meses adicionales.`,
    ],
    hipotesis: [
      `La integración de ${conceptos[0]} con ${conceptos[1]} podría producir mejoras no lineales en los resultados clave.`,
      `${titleCase(conceptos[2] || "El enfoque alternativo")} emergerá como paradigma dominante en un horizonte de 3-5 años.`,
    ],
    especulacion: [
      `Si ${conceptos[0]} alcanza paridad de costo con alternativas convencionales, el campo se reorganizará estructuralmente.`,
      `La convergencia de ${conceptos[1]} y ${conceptos[3] || "tecnologías emergentes"} podría hacer obsoletos los marcos actuales antes de 2030.`,
    ],
  };

  // ── axiomas ─────────────────────────────────────────────────────────────────
  const axiomas = [
    `Todo sistema en ${tema.split(" ").slice(0, 4).join(" ")} está sujeto a restricciones de recursos que determinan el espacio de soluciones posibles.`,
    `La complejidad sin compresibilidad es ruido — cualquier intervención efectiva debe reducirse a principios comunicables.`,
    `La ventaja del pionero es secundaria a la velocidad de ejecución y la eficiencia en el uso de capital epistémico.`,
  ];

  // ── supuestos críticos ───────────────────────────────────────────────────────
  const confianzas: Array<"alta" | "media" | "baja"> = ["alta", "media", "baja"];
  const supuestos_criticos = [
    { texto: `${conceptos[0]} escala de forma predecible dentro de este contexto de investigación.`, confianza: pick(confianzas, h) },
    { texto: `La infraestructura metodológica existente puede adaptarse sin reemplazo completo.`, confianza: pick(confianzas, h, 1) },
    { texto: `El entorno regulatorio y ético permanecerá estable durante el horizonte de estudio.`, confianza: pick(confianzas, h, 2) },
    { texto: `Los actores clave del campo están alineados en la definición del problema central.`, confianza: pick(confianzas, h, 3) },
    { texto: `La dependencia en ${conceptos[1]} no introduce un punto único de fallo crítico.`, confianza: pick(confianzas, h, 4) },
    { texto: `Los datos disponibles son representativos de la población de interés.`, confianza: pick(confianzas, h, 5) },
  ];

  // ── primeros principios ──────────────────────────────────────────────────────
  const primeros_principios = [
    `En este dominio, la restricción fundamental es la disponibilidad de evidencia de alta calidad — todas las decisiones se reducen a gestión de incertidumbre bajo recursos limitados.`,
    `${conceptos[0]} genera valor únicamente cuando reduce la varianza en los resultados, no cuando elimina la posibilidad de fallo.`,
    `Los efectos de red en ${tema.split(" ").slice(0, 3).join(" ")} se componen aproximadamente al 25% por cada duplicación de participantes activos — diseñar para composabilidad.`,
  ];

  // ── red team ─────────────────────────────────────────────────────────────────
  const red_team = [
    { modo_fallo: `${conceptos[0]} no generaliza fuera de las condiciones controladas del estudio`, test_falsificacion: `Replicación en 3 contextos independientes con criterio de rendimiento ≥80% del original` },
    { modo_fallo: `El supuesto sobre el tamaño del mercado o la población objetivo está sobreestimado en 10×`, test_falsificacion: `Modelo de estimación bottom-up con 50 entrevistas a usuarios; rechazar si el mercado direccionable < $50M` },
    { modo_fallo: `La metodología central ya está patentada o publicada por un actor establecido`, test_falsificacion: `Búsqueda de literatura y patentes en bases de datos especializadas en 48 horas` },
    { modo_fallo: `El horizonte de aprobación regulatoria supera los 24 meses`, test_falsificacion: `Consulta con 3 expertos regulatorios; mapear escenario de peor caso` },
    { modo_fallo: `El equipo investigador carece de capacidad para ejecutar la implementación central`, test_falsificacion: `Prototipo en 90 días con 2 investigadores; criterios de éxito/fracaso definidos a priori` },
    { modo_fallo: `El costo de adquisición de evidencia supera el valor marginal de la información`, test_falsificacion: `Análisis costo-beneficio de cada experimento propuesto antes de ejecutar` },
    { modo_fallo: `Disrupciones en la cadena de suministro metodológico o de datos crean escasez crítica`, test_falsificacion: `Identificar 3 fuentes alternativas; estresar el modelo de obtención de datos` },
    { modo_fallo: `Un equivalente de código abierto o acceso libre elimina la propuesta de valor diferencial`, test_falsificacion: `Escaneo semanal del ecosistema; definir explícitamente el foso defensible` },
    { modo_fallo: `La calidad de los datos en este dominio es insuficiente para las afirmaciones del análisis`, test_falsificacion: `Auditoría de 5 datasets representativos; rechazar si >30% de valores faltantes o inconsistentes` },
    { modo_fallo: `Los hallazgos no replican bajo condiciones de ceguera o en poblaciones distintas`, test_falsificacion: `Pre-registro del protocolo de replicación; definir criterios de éxito antes de ejecutar` },
  ];

  // ── foresight ────────────────────────────────────────────────────────────────
  const foresight = {
    drivers: [
      `Aceleración de la inversión en ${conceptos[0]} (CAGR proyectado 20–35% 2025–2030)`,
      `Migración de talento desde enfoques convencionales hacia metodologías centradas en ${conceptos[1]}`,
      `Presión competitiva internacional que crea dinámicas de campeón nacional en este campo`,
    ],
    incertidumbres: [
      `Si ${conceptos[0]} se commoditizará antes de que se produzca captura de valor`,
      `Trayectoria regulatoria: marcos permisivos vs. precautorios`,
    ],
    escenarios: [
      { nombre: "Adopción Acelerada", descripcion: `${titleCase(conceptos[0])} se convierte en infraestructura crítica en 3 años; los actores establecidos adquieren startups y grupos de investigación.` },
      { nombre: "Parálisis Regulatoria", descripcion: `Nuevas regulaciones ralentizan el despliegue; los ganadores son quienes construyeron infraestructura de cumplimiento anticipadamente.` },
      { nombre: "Disrupción Open-Source", descripcion: `Herramientas de código abierto comoditizan ${conceptos[0]}; el valor migra hacia la capa de servicios especializados.` },
    ],
    señales: [
      año ? `Publicación original en ${año} con ${citas || "múltiples"} citas — interés creciente en la comunidad académica` : `Volumen creciente de publicaciones en este dominio en los últimos 24 meses`,
      `Incremento de solicitudes de financiamiento en ${conceptos[0]} en convocatorias recientes de organismos internacionales`,
    ],
  };

  // ── riesgos ──────────────────────────────────────────────────────────────────
  const riesgos = [
    { riesgo: `Uso inadecuado de los hallazgos fuera del alcance definido por el protocolo de investigación`, mitigacion: `Documentar explícitamente los límites de generalización; incluir sección de limitaciones en toda publicación.` },
    { riesgo: `${titleCase(conceptos[0])} incorpora sesgos presentes en los datos de entrenamiento o recolección`, mitigacion: `Auditoría de sesgos antes del despliegue; documentar limitaciones conocidas; proporcionar estimaciones de incertidumbre.` },
    { riesgo: `Concentración de capacidad investigadora en pocos actores genera dependencias sistémicas`, mitigacion: `Publicar metodología abiertamente; fomentar estándares de interoperabilidad; participar en organismos de gobernanza.` },
  ];

  // ── recomendación final ──────────────────────────────────────────────────────
  const recomendacion_final = {
    veredicto,
    fundamento:
      veredicto === "AVANZAR"
        ? `La síntesis de evidencia disponible${citasLabel} indica una base epistémica suficiente para avanzar. Los supuestos críticos de mayor riesgo son manejables mediante los experimentos propuestos. La relación señal/ruido en la literatura es favorable, y los primeros principios del dominio sustentan la dirección de investigación. Se recomienda proceder con rigor metodológico, monitoreando activamente los modos de fallo identificados en el Red Team.`
        : veredicto === "NO AVANZAR"
        ? `El análisis revela que las condiciones actuales no justifican asignación significativa de recursos. Las hipótesis centrales carecen de evidencia falsificable suficiente, y los modos de fallo identificados presentan probabilidades de ocurrencia inaceptables. Se recomienda revisar el marco teórico o esperar hasta que mejore la calidad de la evidencia disponible.`
        : `La dirección es epistémicamente plausible, pero supuestos críticos de alta incertidumbre impiden una recomendación definitiva. Los pasos inmediatos deben orientarse a reducir la incertidumbre de los supuestos con confianza "baja" antes de comprometer recursos significativos.`,
    proximos_pasos: [
      `Realizar revisión sistemática de literatura en los últimos 5 años sobre ${conceptos[0]}`,
      `Mapear a los 10 grupos de investigación más activos en este campo y sus agendas publicadas`,
      `Diseñar protocolo de experimento inicial con criterios de éxito/fracaso pre-registrados`,
    ],
  };

  // ── referencias ─────────────────────────────────────────────────────────────
  // Construir referencias a partir de papers adjuntos + referencias simuladas
  const referencias = [];

  // Papers adjuntos reales primero
  if (seed.papersAdjuntos && seed.papersAdjuntos.length > 0) {
    for (const p of seed.papersAdjuntos.slice(0, 5)) {
      referencias.push({
        titulo: p.titulo,
        autores: (p.autores || ["Autores no especificados"]).join(", "),
        año: p.año || 2024,
        relevancia: `Paper central adjuntado por el investigador. ${p.citas ? `Citado ${p.citas} veces.` : ""}`,
        tipo: "paper" as const,
      });
    }
  }

  // Referencias de contexto generadas
  const refsSimuladas = [
    { titulo: `Fundamentos de ${conceptos[0]}: revisión sistemática 2020–2024`, autores: `García-López, M., Chen, W., Patel, R.`, año: 2023, relevancia: `Revisión sistemática que establece el estado del arte en ${conceptos[0]}`, tipo: "paper" as const },
    { titulo: `${titleCase(conceptos[1])}: mecanismos, aplicaciones y límites`, autores: `Okonkwo, A., Müller, K., Tanaka, S.`, año: pick([2021, 2022, 2023, 2024], h), relevancia: `Análisis de mecanismos subyacentes clave para el marco teórico utilizado`, tipo: "paper" as const },
    { titulo: `Metodología para el estudio de ${conceptos[2] || "sistemas complejos"} en condiciones reales`, autores: `Rodríguez-Vega, P., Smith, J.`, año: pick([2020, 2021, 2022], h, 1), relevancia: `Base metodológica empleada para diseñar los experimentos propuestos`, tipo: "informe" as const },
    { titulo: `Inferencia causal y diseño experimental en ciencias aplicadas`, autores: `Pearl, J., Mackenzie, D.`, año: 2018, relevancia: `Marco teórico para la construcción de hipótesis falsificables y diseño de red team`, tipo: "libro" as const },
    { titulo: `Dataset de referencia: ${conceptos[0]} — benchmarks y métricas estándar`, autores: `Consorcio Internacional de Investigación`, año: pick([2022, 2023, 2024], h, 2), relevancia: `Datos de referencia utilizados para calibrar los supuestos críticos`, tipo: "dataset" as const },
  ];

  // Agregar solo hasta completar 6 referencias totales
  for (const ref of refsSimuladas) {
    if (referencias.length >= 6) break;
    referencias.push(ref);
  }

  return {
    abstract,
    mapa_conceptos,
    cuadrantes,
    axiomas,
    supuestos_criticos,
    primeros_principios,
    red_team,
    foresight,
    riesgos,
    recomendacion_final,
    referencias,
  };
}
